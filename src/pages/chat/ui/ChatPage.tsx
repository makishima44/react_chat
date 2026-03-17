import { FormEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
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

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomStatus, setRoomStatus] = useState<"loading" | "ready" | "missing">("loading");
  const navigate = useNavigate();
  const { roomId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const authUser = auth.currentUser;
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || "anonymous@node";

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

    try {
      await addDoc(collection(db, "messages"), {
        text: trimmed,
        createdAt: serverTimestamp(),
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

  const handleLogout = async () => {
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
        />

        <ChatInput input={input} sending={sending} disabled={roomStatus !== "ready"} onChange={setInput} onSubmit={handleSend} />

      {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>
    </div>
  );
};
