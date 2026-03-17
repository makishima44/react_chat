import { FormEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";

import type { Room } from "@/entities/room/model/types";
import { auth, db } from "@/shared/api/firebase/firebaseConfig";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ChatChallengeModal } from "@/pages/chat/ui/components/ChatChallengeModal";

import s from "./roomsPage.module.css";

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const navigate = useNavigate();
  const challengeInputRef = useRef<HTMLInputElement | null>(null);
  const authUser = auth.currentUser;
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserName = authUser?.displayName?.trim() || authUser?.email || "anonymous@node";

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRooms = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Room, "id">),
        }));
        setRooms(nextRooms);
        setRoomsError("");
      },
      () => {
        setRoomsError("Failed to sync rooms. Please refresh.");
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

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (creating || challengeOpen) return;

    const trimmed = newRoomName.trim();
    if (!trimmed) {
      setCreateError("Введите название комнаты.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setCreateError("Название должно быть от 2 до 40 символов.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        name: trimmed,
        createdAt: serverTimestamp(),
        createdBy: currentUserId,
        createdByName: currentUserName,
      });
      setNewRoomName("");
      navigate(`/chat/${docRef.id}`);
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setCreateError("Нет доступа для создания комнаты.");
      } else {
        setCreateError("Не удалось создать комнату. Попробуйте снова.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleOpenRoom = (roomId: string) => {
    if (challengeOpen) return;
    navigate(`/chat/${roomId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setRoomsError("Logout failed. Please try again.");
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Channel Directory"
        subtitle="Select an existing room or spin up a new secure channel."
        headerSlot={
          <div className={s.headerControls}>
            <span className={s.operatorName}>{currentUserName}</span>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        }
        className={s.roomsFrame}
      >
        <div className={s.content}>
          <form className={s.createForm} onSubmit={handleCreateRoom}>
            <Input
              label="Название комнаты"
              placeholder="Например: Delta-7"
              value={newRoomName}
              onChange={(event) => {
                setNewRoomName(event.target.value);
                if (createError) setCreateError("");
              }}
              maxLength={40}
              required
            />
            {createError && <div className={s.formError}>{createError}</div>}
            <Button type="submit" disabled={creating}>
              {creating ? "Создаю..." : "Создать комнату"}
            </Button>
          </form>

          <div className={s.roomsSection}>
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>Доступные комнаты</h2>
              <span className={s.sectionHint}>{rooms.length} активных</span>
            </div>

            {roomsError && <div className={s.formError}>{roomsError}</div>}

            {rooms.length === 0 ? (
              <div className={s.emptyState}>Комнат пока нет. Создайте первую.</div>
            ) : (
              <div className={s.roomGrid}>
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    className={s.roomCard}
                    onClick={() => handleOpenRoom(room.id)}
                  >
                    <div className={s.roomName}>{room.name || "Безымянный канал"}</div>
                    <div className={s.roomMeta}>
                      {room.createdByName ? `Создал: ${room.createdByName}` : "Создатель неизвестен"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </TerminalFrame>

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
