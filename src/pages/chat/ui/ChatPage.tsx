import { FormEvent, useEffect, useRef, useState } from "react";
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

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [processingMessageId, setProcessingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomStatus, setRoomStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; userId?: string; userName?: string; isTyping?: boolean }>>([]);
  const navigate = useNavigate();
  const { roomId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const authUser = auth.currentUser;
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || "anonymous@node";
  const presenceDocId = roomId && authUser ? `${roomId}_${authUser.uid}` : null;

  const isOwnMessage = (message: Message) =>
    message.userId ? message.userId === currentUserId : message.user === currentUserName || (currentUserEmail && message.user === currentUserEmail);

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
      });
      setInput("");
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setSendError("Access denied. You no longer have permission to post.");
      } else {
        setSendError("Transmission failed. Please try again.");
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
      setSendError("Message cannot be empty.");
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
        setSendError("Access denied. You cannot edit this message.");
      } else {
        setSendError("Failed to edit message. Please try again.");
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
        setSendError("Access denied. You cannot delete this message.");
      } else {
        setSendError("Failed to delete message. Please try again.");
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
      setSendError("Logout failed. Please try again.");
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
        setRoomName(data?.name ?? "Secure Channel");
        setRoomStatus("ready");
      },
      () => {
        setRoomStatus("missing");
      },
    );

    return () => unsubscribe();
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
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Message, "id">),
        }));
        setMessages(msgs);
      },
      (err) => {
        const firebaseError = err as FirebaseError;
        if (firebaseError.code === "failed-precondition") {
          setSendError("Firestore needs a composite index for roomId + createdAt.");
        } else if (firebaseError.code === "permission-denied") {
          setSendError("Access denied. You do not have permission to read this room.");
        } else {
          setSendError("Failed to sync messages. Check your connection.");
        }
      },
    );

    return () => unsubscribe();
  }, [roomId, roomStatus]);

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
      ? `${typingUsers.map((user) => user.userName || "anonymous@node").join(", ")} typing...`
      : "";

  if (!roomId) {
    return null;
  }

  if (roomStatus === "missing") {
    return (
      <div className={s.page}>
        <TerminalFrame
          title="Channel Lost"
          subtitle="This room no longer exists. Return to the directory."
          headerSlot={
            <ChatHeaderControls
              onGoToRooms={() => navigate("/rooms")}
              onLogout={handleLogout}
            />
          }
          className={s.chatFrame}
        >
          <div className={s.roomState}>
            <p>The requested room could not be found.</p>
            <Button type="button" onClick={() => navigate("/rooms")}>
              Back to Rooms
            </Button>
          </div>
        </TerminalFrame>

      </div>
    );
  }

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Secure Channel"
        subtitle={roomName ? `Room: ${roomName}` : "Live relay active. Use encrypted prompt below."}
        headerSlot={<ChatHeaderControls onGoToRooms={() => navigate("/rooms")} onLogout={handleLogout} />}
        className={s.chatFrame}
      >
        <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          messagesEndRef={messagesEndRef}
          editingMessageId={editingMessageId}
          editDraft={editDraft}
          processingMessageId={processingMessageId}
          onStartEdit={handleStartEdit}
          onCancelEdit={handleCancelEdit}
          onEditDraftChange={setEditDraft}
          onSaveEdit={handleSaveEdit}
          onDeleteMessage={handleDeleteMessage}
        />

        <div className={s.presenceBar}>
          <span className={s.onlineState}>{onlineCount} online</span>
          {typingLabel && <span className={s.typingState}>{typingLabel}</span>}
        </div>

        <ChatInput input={input} sending={sending} disabled={roomStatus !== "ready"} onChange={handleInputChange} onSubmit={handleSend} />

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
