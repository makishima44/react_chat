import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";

import type { DirectChat, DirectMessage } from "@/entities/direct-chat/model/types";
import type { Message } from "@/entities/message/model/types";
import { auth, db } from "@/shared/api/firebase/firebaseConfig";
import { sendDirectMessage, syncDirectChatSummary } from "@/shared/api/firebase/directChats";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Button } from "@/shared/ui/button";
import { ChatHeaderControls } from "@/pages/chat/ui/components/ChatHeaderControls";
import { ChatInput } from "@/pages/chat/ui/components/ChatInput";
import { ChatMessages } from "@/pages/chat/ui/components/ChatMessages";
import { DeleteMessageModal } from "@/pages/chat/ui/components/DeleteMessageModal";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { getMentionAliases } from "@/pages/chat/model/mentions";
import { useAppPreferences } from "@/shared/model/preferences";

import s from "./directChatPage.module.css";

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

export const DirectChatPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const mentionAliases = useMemo(() => getMentionAliases(currentUserName, currentUserEmail), [currentUserEmail, currentUserName]);
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
  const {
    nickname,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleNicknameSave,
  } = useUserSettings(authUser);

  const peer = useMemo(() => Object.values(chat?.memberProfiles ?? {}).find((member) => member.userId !== currentUserId) ?? null, [chat?.memberProfiles, currentUserId]);
  const mappedMessages = useMemo(() => messages.map(mapDirectMessageToMessage), [messages]);
  const normalizedSearchQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredMessages = useMemo(() => {
    if (!normalizedSearchQuery) return mappedMessages;

    return mappedMessages.filter((message) => {
      const author = `${message.userName ?? ""} ${message.user ?? ""}`.toLocaleLowerCase();
      const replyText = `${message.replyTo?.text ?? ""} ${message.replyTo?.userName ?? ""} ${message.replyTo?.user ?? ""}`.toLocaleLowerCase();
      return (
        message.text.toLocaleLowerCase().includes(normalizedSearchQuery) ||
        author.includes(normalizedSearchQuery) ||
        replyText.includes(normalizedSearchQuery)
      );
    });
  }, [mappedMessages, normalizedSearchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mappedMessages]);

  useEffect(() => {
    if (!chatId) {
      navigate("/dm", { replace: true });
      return;
    }

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
  }, [chatId, currentUserId, navigate]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setSendError(t("logoutError"));
    }
  };

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

  const isOwnMessage = (message: Message) => message.userId === currentUserId;

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

  if (!chatId) {
    return null;
  }

  if (chatStatus === "missing") {
    return (
      <div className={s.page}>
        <TerminalFrame
          title={t("directChatMissingTitle")}
          subtitle={t("directChatMissingSubtitle")}
          headerSlot={
            <ChatHeaderControls
              onGoToRooms={() => navigate("/rooms")}
              onGoToDirectMessages={() => navigate("/dm")}
              onLogout={handleLogout}
            />
          }
          className={s.directChatFrame}
        >
          <div className={s.roomState}>
            <p>{t("directChatMissingBody")}</p>
            <Button type="button" onClick={() => navigate("/dm")}>
              {t("directChatBack")}
            </Button>
          </div>
        </TerminalFrame>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("directChatTitle")}
        subtitle={peer ? t("directChatSubtitleWithUser", { name: peer.displayName || peer.email }) : t("directChatSubtitleFallback")}
        headerSlot={
          <ChatHeaderControls
            onOpenSettings={openSettings}
            onGoToRooms={() => navigate("/rooms")}
            onGoToDirectMessages={() => navigate("/dm")}
            onLogout={handleLogout}
          />
        }
        className={s.directChatFrame}
        contentClassName={s.directChatFrameContent}
      >
        <div className={s.peerBar}>
          <span className={s.peerLabel}>{t("directChatPeerLabel")}:</span>
          <span className={s.peerName}>{peer?.displayName || peer?.email || t("commonAnonymous")}</span>
          {peer?.email && <span className={s.peerEmail}>{peer.email}</span>}
        </div>

        <div className={s.searchBar}>
          <span className={s.searchLabel}>{t("commonSearch")}</span>
          <input
            type="text"
            className={s.searchInput}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("chatSearchPlaceholder")}
            aria-label={t("chatSearchPlaceholder")}
          />
          <div className={s.searchMeta}>
            <span className={s.searchCount} aria-live="polite">
              {normalizedSearchQuery ? t("chatSearchResults", { count: filteredMessages.length }) : "\u00A0"}
            </span>
            <button
              type="button"
              className={s.searchClearButton}
              onClick={() => setSearchQuery("")}
              disabled={!searchQuery}
              aria-hidden={!searchQuery}
            >
              {t("chatSearchClear")}
            </button>
          </div>
        </div>

        <ChatMessages
          messages={filteredMessages}
          searchQuery={normalizedSearchQuery}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          mentionAliases={mentionAliases}
          messagesEndRef={messagesEndRef}
          editingMessageId={editingMessageId}
          editDraft={editDraft}
          processingMessageId={processingMessageId}
          canModerate={false}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditDraftChange={setEditDraft}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={setReplyTarget}
        />

        <ChatInput
          input={input}
          sending={sending}
          disabled={chatStatus !== "ready"}
          replyTarget={replyTarget}
          onChange={setInput}
          onCancelReply={() => setReplyTarget(null)}
          onSubmit={handleSend}
        />

        {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>

      {deleteTarget && (
        <DeleteMessageModal
          message={deleteTarget}
          deleting={processingMessageId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={nickname}
          nicknameError={nicknameError}
          savingNickname={savingNickname}
          currentUserName={currentUserName}
          onClose={closeSettings}
          onSubmit={handleNicknameSave}
          onNicknameChange={handleNicknameChange}
        />
      )}
    </div>
  );
};
