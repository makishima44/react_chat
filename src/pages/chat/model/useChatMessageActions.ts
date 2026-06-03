import { FormEvent, useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import type { Message } from "@/entities/message/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { TranslateFn } from "@/shared/model/preferences";
import { getPermissionError } from "./firebaseErrors";

type UseChatMessageActionsParams = {
  roomId?: string;
  messages: Message[];
  currentUserId: string;
  currentUserEmail: string;
  currentUserName: string;
  canModerateCurrentRoom: boolean;
  isOwnMessage: (message: Message) => boolean;
  setTypingState: (nextTyping: boolean) => Promise<void>;
  t: TranslateFn;
};

export const useChatMessageActions = ({
  roomId,
  messages,
  currentUserId,
  currentUserEmail,
  currentUserName,
  canModerateCurrentRoom,
  isOwnMessage,
  setTypingState,
  t,
}: UseChatMessageActionsParams) => {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !roomId) return;

    setSending(true);
    setSendError("");
    await setTypingState(false);

    try {
      await addDoc(collection(db, "messages"), {
        text: trimmed,
        createdAt: serverTimestamp(),
        editedAt: null,
        user: currentUserEmail || currentUserName,
        userId: currentUserId,
        userName: currentUserName,
        roomId,
        replyTo: replyTarget
          ? {
              id: replyTarget.id,
              text: replyTarget.text,
              user: replyTarget.user,
              userName: replyTarget.userName,
            }
          : null,
      });
      setInput("");
      setReplyTarget(null);
    } catch (error) {
      setSendError(getPermissionError(error, t("chatPostDenied"), t("chatPostFailed")));
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
    if (!editingMessageId || processingMessageId) return;

    const target = messages.find((message) => message.id === editingMessageId);
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
      await updateDoc(doc(db, "messages", editingMessageId), {
        text: trimmed,
        editedAt: serverTimestamp(),
      });
      handleCancelEdit();
    } catch (error) {
      setSendError(getPermissionError(error, t("chatEditDenied"), t("chatEditFailed")));
    } finally {
      setProcessingMessageId(null);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    if (processingMessageId || (!isOwnMessage(message) && !canModerateCurrentRoom)) return;
    setDeleteTarget(message);
    setSendError("");
  };

  const handleReplyMessage = (message: Message) => {
    if (processingMessageId) return;
    setReplyTarget(message);
    setSendError("");
  };

  const handleCloseDeleteModal = () => {
    if (processingMessageId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || processingMessageId || (!isOwnMessage(deleteTarget) && !canModerateCurrentRoom)) return;

    setProcessingMessageId(deleteTarget.id);
    setSendError("");

    try {
      await deleteDoc(doc(db, "messages", deleteTarget.id));
      if (editingMessageId === deleteTarget.id) {
        handleCancelEdit();
      }
      setDeleteTarget(null);
    } catch (error) {
      setSendError(getPermissionError(error, t("chatDeleteDenied"), t("chatDeleteFailed")));
    } finally {
      setProcessingMessageId(null);
    }
  };

  useEffect(() => {
    if (!deleteTarget) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape" || processingMessageId) return;
      setDeleteTarget(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteTarget, processingMessageId]);

  return {
    input,
    sending,
    sendError,
    editingMessageId,
    editDraft,
    processingMessageId,
    deleteTarget,
    replyTarget,
    setInput,
    setSendError,
    setEditDraft,
    handleSend,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeleteMessage,
    handleReplyMessage,
    handleCancelReply: () => setReplyTarget(null),
    handleCloseDeleteModal,
    handleConfirmDelete,
  };
};
