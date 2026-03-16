import { FormEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";

import type { Message } from "@/entities/message/model/types";
import { db, auth } from "@/shared/api/firebase/firebaseConfig";
import { getNicknameError } from "@/shared/lib/validation";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";

import s from "./chatPage.module.css";
import { ChatChallengeModal } from "./components/ChatChallengeModal";
import { ChatHeaderControls } from "./components/ChatHeaderControls";
import { ChatInput } from "./components/ChatInput";
import { ChatMessages } from "./components/ChatMessages";
import { ChatSettingsModal } from "./components/ChatSettingsModal";

export const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [nickname, setNickname] = useState(auth.currentUser?.displayName ?? "");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const challengeInputRef = useRef<HTMLInputElement | null>(null);
  const authUser = auth.currentUser;
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || "anonymous@node";

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
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const needsChallenge = sessionStorage.getItem("challengeRequired") === "1";
    setChallengeOpen(needsChallenge);
    if (needsChallenge) {
      setChallengeAnswer("");
      setChallengeError("");
    }
  }, []);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
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

  const closeSettings = () => setSettingsOpen(false);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (nicknameError) {
      setNicknameError("");
    }
  };

  const handleNicknameSave = async (event?: FormEvent) => {
    event?.preventDefault();
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

  useEffect(() => {
    if (challengeOpen) {
      challengeInputRef.current?.focus();
    }
  }, [challengeOpen]);

  const handleChallengeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = challengeAnswer.trim().toLowerCase();
    if (normalized === "мы обретаем свободу") {
      sessionStorage.removeItem("challengeRequired");
      setChallengeOpen(false);
      setChallengeError("");
      return;
    }
    setChallengeError("Неверно. Ты еблан!");
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Secure Channel"
        subtitle="Live relay active. Use encrypted prompt below."
        headerSlot={<ChatHeaderControls onOpenSettings={openSettings} onLogout={handleLogout} />}
        className={s.chatFrame}
      >
        <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
          currentUserName={currentUserName}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput input={input} sending={sending} onChange={setInput} onSubmit={handleSend} />

        {sendError && <div className={s.sendError}>{sendError}</div>}
      </TerminalFrame>

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

      {challengeOpen && (
        <ChatChallengeModal
          challengeAnswer={challengeAnswer}
          challengeError={challengeError}
          inputRef={challengeInputRef}
          onAnswerChange={(value) => {
            setChallengeAnswer(value);
            if (challengeError) {
              setChallengeError("");
            }
          }}
          onSubmit={handleChallengeSubmit}
        />
      )}
    </div>
  );
};
