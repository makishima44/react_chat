import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";

import type { DirectChat, DirectMessage } from "@/entities/direct-chat/model/types";
import type { Message } from "@/entities/message/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import { sendDirectMessage, syncDirectChatSummary } from "@/shared/api/firebase/directChats";
import { getMentionAliases } from "@/pages/chat/model/mentions";
import { useAppPreferences } from "@/shared/model/preferences";
import { useMessageSearch } from "@/pages/chat/model/useMessageSearch";

const mapDirectMessageToMessage = (message: DirectMessage): Message => ({
  id: message.id,
  text: message.text,
  createdAt: message.createdAt,
  editedAt: message.editedAt,
  user: message.userName,
  userId: message.userId,
  userName: message.userName,
  replyTo: message.replyTo
    ? {
        id: message.replyTo.id,
        text: message.replyTo.text,
        user: message.replyTo.userName,
        userName: message.replyTo.userName,
      }
    : null,
});

type UseDirectChatConversationParams = {
  chatId?: string;
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
};

export const useDirectChatConversation = ({
  chatId,
  currentUserId,
  currentUserEmail,
  currentUserName,
}: UseDirectChatConversationParams) => {
  const { t } = useAppPreferences();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [chat, setChat] = useState<DirectChat | null>(null);
  const [chatStatus, setChatStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  const mentionAliases = useMemo(() => getMentionAliases(currentUserName, currentUserEmail), [currentUserEmail, currentUserName]);

  const peer = useMemo(
    () => Object.values(chat?.memberProfiles ?? {}).find((member) => member.userId !== currentUserId) ?? null,
    [chat?.memberProfiles, currentUserId],
  );
  const mappedMessages = useMemo(() => messages.map(mapDirectMessageToMessage), [messages]);
  const { normalizedSearchQuery, filteredMessages } = useMessageSearch(mappedMessages, searchQuery);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mappedMessages]);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    setChatStatus("loading");
    setChat(null);

    const chatRef = doc(db, "directChats", chatId);
    const unsubscribe = onSnapshot(
      chatRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setChat(null);
          setChatStatus("missing");
          return;
        }

        const data = snapshot.data() as Omit<DirectChat, "id">;
        const nextChat = { id: snapshot.id, ...data };

        if (!nextChat.memberIds?.includes(currentUserId)) {
          setChat(null);
          setChatStatus("missing");
          return;
        }

        setChat(nextChat);
        setChatStatus("ready");
      },
      () => {
        setChat(null);
        setChatStatus("missing");
      },
    );

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  useEffect(() => {
    if (!chatId || chatStatus !== "ready") {
      setMessages([]);
      return;
    }

    const messagesQuery = query(collection(db, "directChats", chatId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<DirectMessage, "id">),
        }));

        setMessages(nextMessages);
        setSendError("");
      },
      (error) => {
        const firebaseError = error as FirebaseError;
        if (firebaseError.code === "failed-precondition") {
          setSendError(t("directChatIndexMissing"));
        } else if (firebaseError.code === "permission-denied") {
          setSendError(t("directChatReadDenied"));
        } else {
          setSendError(t("directChatSyncFailed"));
        }
      },
    );

    return () => unsubscribe();
  }, [chatId, chatStatus, t]);

  useEffect(() => {
    setSearchQuery("");
    setInput("");
    setSendError("");
    setEditingMessageId(null);
    setEditDraft("");
    setProcessingMessageId(null);
    setDeleteTarget(null);
    setReplyTarget(null);
  }, [chatId]);

  const isOwnMessage = (message: Message) => message.userId === currentUserId;

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!chatId || !peer || sending) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    setSending(true);
    setSendError("");

    try {
      await sendDirectMessage({
        chatId,
        currentUser: {
          userId: currentUserId,
          displayName: currentUserName,
          email: currentUserEmail,
        },
        text: trimmed,
        replyTo: replyTarget
          ? {
              id: replyTarget.id,
              text: replyTarget.text,
              userId: replyTarget.userId ?? "",
              userName: replyTarget.userName || replyTarget.user || t("commonAnonymous"),
            }
          : null,
      });
      setInput("");
      setReplyTarget(null);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("directChatSendDenied"));
      } else {
        setSendError(t("directChatSendFailed"));
      }
    } finally {
      setSending(false);
    }
  };

  const handleStartEdit = (message: Message) => {
    if (!isOwnMessage(message)) return;
    setEditingMessageId(message.id);
    setEditDraft(message.text);
    setSendError("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
  };

  const handleSaveEdit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!chatId || !editingMessageId || processingMessageId) return;

    const target = mappedMessages.find((message) => message.id === editingMessageId);
    if (!target || !isOwnMessage(target)) {
      handleCancelEdit();
      return;
    }

    const trimmed = editDraft.trim();
    if (!trimmed) {
      setSendError(t("chatMessageEmpty"));
      return;
    }
    if (trimmed === target.text) {
      handleCancelEdit();
      return;
    }

    setProcessingMessageId(editingMessageId);
    setSendError("");

    try {
      await updateDoc(doc(db, "directChats", chatId, "messages", editingMessageId), {
        text: trimmed,
        editedAt: serverTimestamp(),
      });
      await syncDirectChatSummary(chatId);
      handleCancelEdit();
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("directChatEditDenied"));
      } else {
        setSendError(t("directChatEditFailed"));
      }
    } finally {
      setProcessingMessageId(null);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    if (!isOwnMessage(message) || processingMessageId) return;
    setDeleteTarget(message);
    setSendError("");
  };

  const handleConfirmDelete = async () => {
    if (!chatId || !deleteTarget || processingMessageId || !isOwnMessage(deleteTarget)) return;

    setProcessingMessageId(deleteTarget.id);
    setSendError("");

    try {
      await deleteDoc(doc(db, "directChats", chatId, "messages", deleteTarget.id));
      await syncDirectChatSummary(chatId);
      if (editingMessageId === deleteTarget.id) {
        handleCancelEdit();
      }
      setDeleteTarget(null);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("directChatDeleteDenied"));
      } else {
        setSendError(t("directChatDeleteFailed"));
      }
    } finally {
      setProcessingMessageId(null);
    }
  };

  return {
    chatStatus,
    peer,
    mentionAliases,
    mappedMessages,
    normalizedSearchQuery,
    filteredMessages,
    messagesEndRef,
    searchQuery,
    setSearchQuery,
    input,
    sending,
    sendError,
    setSendError,
    editingMessageId,
    editDraft,
    processingMessageId,
    deleteTarget,
    replyTarget,
    setInput,
    setEditDraft,
    setReplyTarget,
    setDeleteTarget,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteMessage,
    handleConfirmDelete,
  };
};
