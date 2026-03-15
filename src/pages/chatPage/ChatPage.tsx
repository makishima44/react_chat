import { FormEvent, useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { db, auth } from "../../services/firebase/firebaseConfig";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Timestamp } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";

import s from "./chatPage.module.css";
import { Button } from "@/components/UI/button";
import { TerminalFrame } from "@/components/layout/TerminalFrame";
import { getNicknameError } from "@/utils/validation";

type Message = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  user: string;
  userId?: string;
  userName?: string;
};

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [nickname, setNickname] = useState(auth.currentUser?.displayName ?? "");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const authUser = auth.currentUser;
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName =
    authUser?.displayName?.trim() || currentUserEmail || "anonymous@node";

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
        user: currentUserEmail || currentUserName,
        userId: currentUserId,
        userName: currentUserName,
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

  const openSettings = () => {
    setNickname(authUser?.displayName ?? "");
    setNicknameError("");
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setSettingsOpen(false);
  };

  const handleNicknameSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!authUser || savingNickname) return;
    const nextError = getNicknameError(nickname);
    setNicknameError(nextError);
    if (nextError) return;

    const trimmed = nickname.trim();
    if (trimmed === (authUser.displayName ?? "")) return;

    setSavingNickname(true);
    try {
      await updateProfile(authUser, { displayName: trimmed });
      setNickname(trimmed);
      setNicknameError("");
      setSettingsOpen(false);
    } catch {
      setNicknameError("Failed to update nickname. Please try again.");
    } finally {
      setSavingNickname(false);
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
    if (!settingsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSettings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Secure Channel"
        subtitle="Live relay active. Use encrypted prompt below."
        headerSlot={
          <div className={s.headerControls}>
            <Button
              type="button"
              variant="ghost"
              className={s.iconButton}
              onClick={openSettings}
              aria-label="Open settings"
            >
              <svg
                className={s.icon}
                viewBox="0 0 24 24"
                role="img"
                aria-hidden="true"
              >
                <path
                  d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM4.93 12.5c-.02-.16-.03-.33-.03-.5 0-.17.01-.34.03-.5l2.05-.32a5.96 5.96 0 0 1 .83-1.99l-1.22-1.67c.2-.25.42-.47.66-.69l1.67 1.22c.62-.38 1.29-.66 1.99-.83l.32-2.05c.16-.02.33-.03.5-.03.17 0 .34.01.5.03l.32 2.05c.7.17 1.37.45 1.99.83l1.67-1.22c.24.22.46.44.66.69l-1.22 1.67c.38.62.66 1.29.83 1.99l2.05.32c.02.16.03.33.03.5 0 .17-.01.34-.03.5l-2.05.32a5.96 5.96 0 0 1-.83 1.99l1.22 1.67c-.2.25-.42.47-.66.69l-1.67-1.22a5.96 5.96 0 0 1-1.99.83l-.32 2.05c-.16.02-.33.03-.5.03-.17 0-.34-.01-.5-.03l-.32-2.05a5.96 5.96 0 0 1-1.99-.83l-1.67 1.22c-.24-.22-.46-.44-.66-.69l1.22-1.67a5.96 5.96 0 0 1-.83-1.99l-2.05-.32Z"
                  fill="currentColor"
                />
              </svg>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        }
        className={s.chatFrame}
      >
        <div className={s.messages} role="log" aria-live="polite">
          {messages.length === 0 && <div className={s.empty}>No transmissions yet.</div>}
          {messages.map((msg) => {
            const displayName = msg.userName || msg.user || "anonymous@node";
            const isOwn = msg.userId
              ? msg.userId === currentUserId
              : msg.user === currentUserName ||
                (currentUserEmail && msg.user === currentUserEmail);

            return (
              <div key={msg.id} className={clsx(s.message, isOwn && s.messageOwn)}>
                <span className={s.prompt}>&gt;</span>
                <span className={s.user}>{displayName}</span>
                <span className={s.separator}>:</span>
                <span className={s.text}>{msg.text}</span>
              </div>
            );
          })}
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

      {settingsOpen && (
        <div className={s.modalOverlay} onClick={closeSettings}>
          <div
            className={s.modal}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle} id="settings-title">
                Settings
              </h2>
              <button
                type="button"
                className={s.modalClose}
                onClick={closeSettings}
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            <form className={s.nicknameForm} onSubmit={handleNicknameSave}>
              <div className={s.nicknameField}>
                <label className={s.nicknameLabel} htmlFor="nickname">
                  Nickname
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (nicknameError) {
                      setNicknameError("");
                    }
                  }}
                  placeholder={currentUserName}
                  maxLength={24}
                  disabled={!authUser || savingNickname}
                  aria-label="Nickname"
                />
                {nicknameError && <div className={s.nicknameError}>{nicknameError}</div>}
              </div>

              <div className={s.modalActions}>
                <Button type="button" variant="ghost" onClick={closeSettings}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!authUser || savingNickname}>
                  {savingNickname ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
