import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate, useParams } from "react-router-dom";

import type { Message } from "@/entities/message/model/types";
import { db, auth } from "@/shared/api/firebase/firebaseConfig";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Button } from "@/shared/ui/button";

import s from "./chatPage.module.css";
import { ChatHeaderControls } from "./components/ChatHeaderControls";
import { ChatInput } from "./components/ChatInput";
import { ChatMessages } from "./components/ChatMessages";
import { DeleteMessageModal } from "./components/DeleteMessageModal";
import { getMentionAliases, isMessageMentioningUser } from "@/pages/chat/model/mentions";
import { useAppPreferences } from "@/shared/model/preferences";

type NotificationPermissionState = NotificationPermission | "unsupported";

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomStatus, setRoomStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; userId?: string; userName?: string; isTyping?: boolean }>>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>("unsupported");
  const navigate = useNavigate();
  const { roomId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const presenceDocId = roomId && authUser ? `${roomId}_${authUser.uid}` : null;
  const mentionAliases = useMemo(() => getMentionAliases(currentUserName, currentUserEmail), [currentUserName, currentUserEmail]);

  const isOwnMessage = useCallback(
    (message: Message) =>
      message.userId ? message.userId === currentUserId : message.user === currentUserName || (currentUserEmail && message.user === currentUserEmail),
    [currentUserEmail, currentUserId, currentUserName],
  );

  const handleEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const setTypingState = async (nextTyping: boolean) => {
    if (!presenceDocId || !roomId || !authUser || isTypingRef.current === nextTyping) return;

    isTypingRef.current = nextTyping;
    try {
      await setDoc(
        doc(db, "roomPresence", presenceDocId),
        {
          roomId,
          userId: authUser.uid,
          userName: currentUserName,
          isOnline: true,
          isTyping: nextTyping,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch {
      // Best-effort UI signal; chat should continue to work even if presence write fails.
    }
  };

  useEffect(() => {
    if (!roomId) {
      navigate("/rooms", { replace: true });
    }
  }, [roomId, navigate]);

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
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("chatPostDenied"));
      } else {
        setSendError(t("chatPostFailed"));
      }
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    if (!authUser || !roomId || roomStatus !== "ready") return;

    const hasText = value.trim().length > 0;
    if (hasText && !isTypingRef.current) {
      void setTypingState(true);
    }
    if (!hasText && isTypingRef.current) {
      void setTypingState(false);
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    if (hasText) {
      typingTimeoutRef.current = window.setTimeout(() => {
        void setTypingState(false);
      }, 1200);
    } else {
      typingTimeoutRef.current = null;
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
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("chatEditDenied"));
      } else {
        setSendError(t("chatEditFailed"));
      }
    } finally {
      setProcessingMessageId(null);
    }
  };

  const handleDeleteMessage = (message: Message) => {
    if (processingMessageId || !isOwnMessage(message)) return;
    setDeleteTarget(message);
    setSendError("");
  };

  const handleReplyMessage = (message: Message) => {
    if (processingMessageId) return;
    setReplyTarget(message);
    setSendError("");
  };

  const handleCancelReply = () => {
    setReplyTarget(null);
  };

  const handleCloseDeleteModal = () => {
    if (processingMessageId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || processingMessageId || !isOwnMessage(deleteTarget)) return;

    setProcessingMessageId(deleteTarget.id);
    setSendError("");

    try {
      await deleteDoc(doc(db, "messages", deleteTarget.id));
      if (editingMessageId === deleteTarget.id) {
        handleCancelEdit();
      }
      setDeleteTarget(null);
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError(t("chatDeleteDenied"));
      } else {
        setSendError(t("chatDeleteFailed"));
      }
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

  const handleLogout = async () => {
    await setTypingState(false);
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setSendError(t("logoutError"));
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sessionStorage.getItem("challengeRequired") === "1") {
      navigate("/rooms", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!roomId) return;
    setRoomStatus("loading");
    setRoomName("");
    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoomStatus("missing");
          setRoomName("");
          return;
        }
        const data = snapshot.data() as { name?: string };
        setRoomName(data?.name ?? t("chatTitle"));
        setRoomStatus("ready");
      },
      () => {
        setRoomStatus("missing");
      },
    );

    return () => unsubscribe();
  }, [roomId, t]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  useEffect(() => {
    knownMessageIdsRef.current = new Set();
    notifiedMessageIdsRef.current = new Set();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || roomStatus === "missing") {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "messages"), where("roomId", "==", roomId), orderBy("createdAt"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Message, "id">),
        }));

        const previousMessageIds = knownMessageIdsRef.current;
        const nextMessageIds = new Set(msgs.map((message) => message.id));
        const isInitialSync = previousMessageIds.size === 0;
        const newMessages = isInitialSync ? [] : msgs.filter((message) => !previousMessageIds.has(message.id));
        knownMessageIdsRef.current = nextMessageIds;

        if (notificationPermission === "granted" && document.visibilityState !== "visible") {
          newMessages.forEach((message) => {
            if (notifiedMessageIdsRef.current.has(message.id)) return;
            if (isOwnMessage(message)) return;
            if (!isMessageMentioningUser(message.text, mentionAliases)) return;

            const author = message.userName || message.user || t("commonAnonymous");
            const textPreview = message.text.length > 120 ? `${message.text.slice(0, 120)}...` : message.text;
            const title = roomName ? t("mentionNotificationTitle", { room: roomName }) : t("mentionNotificationTitleFallback");

            const mentionNotification = new Notification(title, {
              body: `${author}: ${textPreview}`,
              tag: `mention-${message.id}`,
            });

            mentionNotification.onclick = () => {
              window.focus();
              mentionNotification.close();
            };

            window.setTimeout(() => mentionNotification.close(), 7000);
            notifiedMessageIdsRef.current.add(message.id);
          });
        }

        setMessages(msgs);
      },
      (err) => {
        const firebaseError = err as FirebaseError;
        if (firebaseError.code === "failed-precondition") {
          setSendError(t("chatIndexMissing"));
        } else if (firebaseError.code === "permission-denied") {
          setSendError(t("chatReadDenied"));
        } else {
          setSendError(t("chatSyncFailed"));
        }
      },
    );

    return () => unsubscribe();
  }, [isOwnMessage, mentionAliases, notificationPermission, roomId, roomName, roomStatus, t]);

  useEffect(() => {
    if (!roomId || !authUser || roomStatus !== "ready") {
      setOnlineUsers([]);
      return;
    }

    const q = query(collection(db, "roomPresence"), where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeUsers = snapshot.docs
          .map((docSnapshot) => ({
            id: docSnapshot.id,
            ...(docSnapshot.data() as { userId?: string; userName?: string; isOnline?: boolean; isTyping?: boolean }),
          }))
          .filter((entry) => entry.isOnline);

        setOnlineUsers(activeUsers);
      },
      () => {
        // Presence issues should not break chat; ignore snapshot error.
      },
    );

    return () => unsubscribe();
  }, [authUser, roomId, roomStatus]);

  useEffect(() => {
    if (!roomId || !authUser || !presenceDocId || roomStatus !== "ready") return;

    const presenceRef = doc(db, "roomPresence", presenceDocId);
    const writePresence = async (isOnline: boolean, isTyping: boolean) => {
      await setDoc(
        presenceRef,
        {
          roomId,
          userId: authUser.uid,
          userName: currentUserName,
          isOnline,
          isTyping,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
    };

    void writePresence(true, false).catch(() => {});

    const handleBeforeUnload = () => {
      void writePresence(false, false).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      void writePresence(false, false).catch(() => {});
    };
  }, [authUser, currentUserName, presenceDocId, roomId, roomStatus]);

  const typingUsers = onlineUsers.filter((user) => user.isTyping && user.userId !== currentUserId);
  const onlineCount = onlineUsers.length;
  const typingLabel =
    typingUsers.length > 0
      ? t("chatTyping", { names: typingUsers.map((user) => user.userName || t("commonAnonymous")).join(", ") })
      : "";

  if (!roomId) {
    return null;
  }

  if (roomStatus === "missing") {
    return (
      <div className={s.page}>
        <TerminalFrame
          title={t("chatMissingTitle")}
          subtitle={t("chatMissingSubtitle")}
          headerSlot={
            <ChatHeaderControls
              onGoToRooms={() => navigate("/rooms")}
              onLogout={handleLogout}
            />
          }
          className={s.chatFrame}
        >
          <div className={s.roomState}>
            <p>{t("chatMissingBody")}</p>
            <Button type="button" onClick={() => navigate("/rooms")}>
              {t("chatBackToRooms")}
            </Button>
          </div>
        </TerminalFrame>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("chatTitle")}
        subtitle={roomName ? t("chatSubtitleWithRoom", { name: roomName }) : t("chatSubtitleFallback")}
        headerSlot={<ChatHeaderControls onGoToRooms={() => navigate("/rooms")} onLogout={handleLogout} />}
        className={s.chatFrame}
      >
        <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          mentionAliases={mentionAliases}
          messagesEndRef={messagesEndRef}
          editingMessageId={editingMessageId}
          editDraft={editDraft}
          processingMessageId={processingMessageId}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditDraftChange={setEditDraft}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
          onReplyMessage={handleReplyMessage}
        />

        <div className={s.presenceBar}>
          <span className={s.onlineState}>{t("chatOnline", { count: onlineCount })}</span>
          {typingLabel && <span className={s.typingState}>{typingLabel}</span>}
          {notificationPermission === "default" && (
            <button type="button" className={s.notificationButton} onClick={handleEnableNotifications}>
              {t("chatEnableMentionAlerts")}
            </button>
          )}
          {notificationPermission === "granted" && <span className={s.notificationEnabled}>{t("chatMentionAlertsEnabled")}</span>}
          {notificationPermission === "denied" && <span className={s.notificationDenied}>{t("chatMentionAlertsBlocked")}</span>}
        </div>

        <ChatInput
          input={input}
          sending={sending}
          disabled={roomStatus !== "ready"}
          replyTarget={replyTarget}
          onChange={handleInputChange}
          onCancelReply={handleCancelReply}
          onSubmit={handleSend}
        />

        {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>

      {deleteTarget && (
        <DeleteMessageModal
          message={deleteTarget}
          deleting={processingMessageId === deleteTarget.id}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
