import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import type { Room } from "@/entities/room/model/types";
import { auth, db } from "@/shared/api/firebase/firebaseConfig";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ChatChallengeModal } from "@/pages/chat/ui/components/ChatChallengeModal";

import s from "./roomsPage.module.css";
import modalS from "@/pages/chat/ui/chatPage.module.css";

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
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
    if (deleteError) setDeleteError("");
    navigate(`/chat/${roomId}`);
  };

  const handleRoomKeyDown = (event: KeyboardEvent<HTMLDivElement>, roomId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenRoom(roomId);
    }
  };

  const handleOpenDeleteModal = (room: Room) => {
    if (challengeOpen || deletingRoomId) return;

    const isOwner = room.createdBy === currentUserId;
    if (!isOwner) {
      setDeleteError("Нет доступа для удаления комнаты.");
      return;
    }

    setDeleteError("");
    setDeleteTarget(room);
  };

  const handleCloseDeleteModal = () => {
    if (deletingRoomId) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const room = deleteTarget;
    if (challengeOpen || deletingRoomId) return;

    const isOwner = room.createdBy === currentUserId;
    if (!isOwner) {
      setDeleteError("Нет доступа для удаления комнаты.");
      return;
    }

    setDeletingRoomId(room.id);
    setDeleteError("");

    try {
      const messagesQuery = query(collection(db, "messages"), where("roomId", "==", room.id));
      const messagesSnapshot = await getDocs(messagesQuery);
      const messageDocs = messagesSnapshot.docs;
      const batchSize = 450;

      for (let i = 0; i < messageDocs.length; i += batchSize) {
        const batch = writeBatch(db);
        messageDocs.slice(i, i + batchSize).forEach((messageDoc) => {
          batch.delete(messageDoc.ref);
        });
        await batch.commit();
      }

      await deleteDoc(doc(db, "rooms", room.id));
      setDeleteTarget(null);
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setDeleteError("Нет доступа для удаления комнаты.");
      } else {
        setDeleteError("Не удалось удалить комнату. Попробуйте снова.");
      }
    } finally {
      setDeletingRoomId(null);
    }
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
        title='Channel Directory'
        subtitle='Select an existing room or spin up a new secure channel.'
        headerSlot={
          <div className={s.headerControls}>
            <span className={s.operatorName}>{currentUserName}</span>
            <Button variant='ghost' onClick={handleLogout}>
              Logout
            </Button>
          </div>
        }
        className={s.roomsFrame}
      >
        <div className={s.content}>
          <form className={s.createForm} onSubmit={handleCreateRoom}>
            <Input
              label='Название комнаты'
              placeholder='Например: Delta-7'
              value={newRoomName}
              onChange={(event) => {
                setNewRoomName(event.target.value);
                if (createError) setCreateError("");
              }}
              maxLength={40}
              required
            />
            {createError && <div className={s.formError}>{createError}</div>}
            <Button type='submit' disabled={creating}>
              {creating ? "Создаю..." : "Создать комнату"}
            </Button>
          </form>

          <div className={s.roomsSection}>
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>Доступные комнаты</h2>
              <span className={s.sectionHint}>{rooms.length} активных</span>
            </div>

            {roomsError && <div className={s.formError}>{roomsError}</div>}
            {deleteError && <div className={s.formError}>{deleteError}</div>}

            {rooms.length === 0 ? (
              <div className={s.emptyState}>Комнат пока нет. Создайте первую.</div>
            ) : (
              <div className={s.roomGrid}>
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={clsx(s.roomCard, deletingRoomId === room.id && s.roomCardDisabled)}
                    role='button'
                    tabIndex={0}
                    aria-disabled={deletingRoomId === room.id}
                    onClick={() => handleOpenRoom(room.id)}
                    onKeyDown={(event) => handleRoomKeyDown(event, room.id)}
                  >
                    <div className={s.roomHeader}>
                      <div className={s.roomName}>{room.name || "Безымянный канал"}</div>
                      {room.createdBy === currentUserId && (
                        <button
                          type='button'
                          className={s.deleteButton}
                          disabled={deletingRoomId === room.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDeleteModal(room);
                          }}
                        >
                          {deletingRoomId === room.id ? "Удаляю..." : "Удалить"}
                        </button>
                      )}
                    </div>
                    <div className={s.roomMeta}>{room.createdByName ? `Создал: ${room.createdByName}` : "Создатель неизвестен"}</div>
                  </div>
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

      {deleteTarget && (
        <div className={modalS.modalOverlay} onClick={handleCloseDeleteModal}>
          <div className={modalS.modal} onClick={(event) => event.stopPropagation()} role='dialog' aria-modal='true' aria-labelledby='delete-room-title'>
            <div className={modalS.modalHeader}>
              <h2 className={modalS.modalTitle} id='delete-room-title'>
                Delete
              </h2>
              <button type='button' className={modalS.modalClose} onClick={handleCloseDeleteModal} aria-label='Закрыть'>
                ×
              </button>
            </div>

            <div className={s.deleteModalBody}>
              <p className={modalS.challengePrompt}>Вы уверены, что хотите удалить комнату "{deleteTarget.name || "Безымянный канал"}"?</p>
              <p className={modalS.challengePrompt}>Все сообщения этой комнаты будут удалены без возможности восстановления.</p>
            </div>

            <div className={modalS.modalActions}>
              <Button type='button' variant='ghost' onClick={handleCloseDeleteModal} disabled={!!deletingRoomId}>
                Отмена
              </Button>
              <Button type='button' className={s.dangerAction} onClick={handleConfirmDelete} disabled={!!deletingRoomId}>
                {deletingRoomId ? "Удаляю..." : "Удалить"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
