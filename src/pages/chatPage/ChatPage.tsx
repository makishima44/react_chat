import { FormEvent, useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { db, auth } from "../../services/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";

import s from "./chatPage.module.css";
import { Button } from "@/components/UI/button";
import { TerminalFrame } from "@/components/layout/TerminalFrame";

type Message = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  user: string;
};

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUser = auth.currentUser?.email ?? "anonymous@node";

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Message, "id">),
        }));
        setMessages(msgs);
      },
      () => {
        setSendError("Failed to sync messages. Check your connection.");
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSend = async (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError("");

    try {
      await addDoc(collection(db, "messages"), {
        text: trimmed,
        createdAt: serverTimestamp(),
        user: currentUser,
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

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Secure Channel"
        subtitle="Live relay active. Use encrypted prompt below."
        headerSlot={
          <Button variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        }
        className={s.chatFrame}
      >
        <div className={s.messages} role="log" aria-live="polite">
          {messages.length === 0 && <div className={s.empty}>No transmissions yet.</div>}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(s.message, msg.user === currentUser && s.messageOwn)}
            >
              <span className={s.prompt}>&gt;</span>
              <span className={s.user}>{msg.user}</span>
              <span className={s.separator}>:</span>
              <span className={s.text}>{msg.text}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className={s.inputArea} onSubmit={handleSend}>
          <span className={s.inputPrompt}>$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit message"
            disabled={sending}
            aria-label="Message"
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            {sending ? "Sending..." : "Transmit"}
          </Button>
        </form>

        {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>
    </div>
  );
};
