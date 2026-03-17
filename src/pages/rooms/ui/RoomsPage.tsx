import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where, writeBatch } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

import type { Room } from "@/entities/room/model/types";
import { auth, db } from "@/shared/api/firebase/firebaseConfig";
import { getNicknameError } from "@/shared/lib/validation";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { ChatChallengeModal } from "@/pages/chat/ui/components/ChatChallengeModal";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";

import s from "./roomsPage.module.css";
import modalS from "@/pages/chat/ui/chatPage.module.css";

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [nickname, setNickname] = useState(auth.currentUser?.displayName ?? "");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [accessTarget, setAccessTarget] = useState<Room | null>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
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

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  const openSettings = () => {
    setNickname(authUser?.displayName ?? "");
    setNicknameError("");
    setSettingsOpen(true);
  };

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
    const trimmedPassword = newRoomPassword.trim();
    if (!trimmed) {
      setCreateError("Введите название комнаты.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setCreateError("Название должно быть от 2 до 40 символов.");
      return;
    }
    if (!trimmedPassword) {
      setCreateError("Введите пароль комнаты.");
      return;
    }
    if (trimmedPassword.length < 4 || trimmedPassword.length > 32) {
      setCreateError("Пароль должен быть от 4 до 32 символов.");
      return;
    }

    setCreating(true);
    setCreateError("");

    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        name: trimmed,
        password: trimmedPassword,
        createdAt: serverTimestamp(),
        createdBy: currentUserId,
        createdByName: currentUserName,
      });
      setNewRoomName("");
      setNewRoomPassword("");
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

  const handleOpenRoom = (roomId: string, room?: Room) => {
    if (challengeOpen) return;
    if (deleteError) setDeleteError("");
    if (accessError) setAccessError("");
    if (room?.password) {
      setAccessTarget(room);
      setAccessPassword("");
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  const handleRoomKeyDown = (event: KeyboardEvent<HTMLDivElement>, roomId: string, room: Room) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenRoom(roomId, room);
    }
  };

  const handleCloseAccessModal = () => {
    setAccessTarget(null);
    setAccessPassword("");
    setAccessError("");
  };

  const handleConfirmAccess = () => {
    if (!accessTarget) return;
    const trimmed = accessPassword.trim();
    if (!trimmed) {
      setAccessError("Введите пароль.");
      return;
    }
    if (trimmed !== (accessTarget.password ?? "")) {
      setAccessError("Неверный пароль.");
      return;
    }
    const targetId = accessTarget.id;
    handleCloseAccessModal();
    navigate(`/chat/${targetId}`);
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
            <Button type='button' variant='ghost' className={s.iconButton} onClick={openSettings} aria-label='Открыть настройки'>
              <svg className={s.icon} viewBox='0 0 24 24' role='img' aria-hidden='true'>
                <path
                  d='M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM4.93 12.5c-.02-.16-.03-.33-.03-.5 0-.17.01-.34.03-.5l2.05-.32a5.96 5.96 0 0 1 .83-1.99l-1.22-1.67c.2-.25.42-.47.66-.69l1.67 1.22c.62-.38 1.29-.66 1.99-.83l.32-2.05c.16-.02.33-.03.5-.03.17 0 .34.01.5.03l.32 2.05c.7.17 1.37.45 1.99.83l1.67-1.22c.24.22.46.44.66.69l-1.22 1.67c.38.62.66 1.29.83 1.99l2.05.32c.02.16.03.33.03.5 0 .17-.01.34-.03.5l-2.05.32a5.96 5.96 0 0 1-.83 1.99l1.22 1.67c-.2.25-.42.47-.66.69l-1.67-1.22a5.96 5.96 0 0 1-1.99.83l-.32 2.05c-.16-.02-.33-.03-.5-.03-.17 0-.34.01-.5.03l-.32-2.05a5.96 5.96 0 0 1-1.99-.83l-1.67 1.22c-.24-.22-.46-.44-.66-.69l1.22-1.67a5.96 5.96 0 0 1-.83-1.99l-2.05-.32Z'
                  fill='currentColor'
                />
              </svg>
            </Button>
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
            <Input
              label='Пароль комнаты'
              placeholder='Минимум 4 символа'
              value={newRoomPassword}
              type='password'
              onChange={(event) => {
                setNewRoomPassword(event.target.value);
                if (createError) setCreateError("");
              }}
              maxLength={32}
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
                    onClick={() => handleOpenRoom(room.id, room)}
                    onKeyDown={(event) => handleRoomKeyDown(event, room.id, room)}
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
                Удалить комнату
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

      {settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={nickname}
          nicknameError={nicknameError}
          savingNickname={savingNickname}
          currentUserName={currentUserName}
          onClose={() => setSettingsOpen(false)}
          onSubmit={handleNicknameSave}
          onNicknameChange={handleNicknameChange}
        />
      )}

      {accessTarget && (
        <div className={modalS.modalOverlay} onClick={handleCloseAccessModal}>
          <div className={modalS.modal} onClick={(event) => event.stopPropagation()} role='dialog' aria-modal='true' aria-labelledby='access-room-title'>
            <div className={modalS.modalHeader}>
              <h2 className={modalS.modalTitle} id='access-room-title'>
                Доступ к комнате
              </h2>
              <button type='button' className={modalS.modalClose} onClick={handleCloseAccessModal} aria-label='Закрыть'>
                ×
              </button>
            </div>

            <div className={s.accessModalBody}>
              <p className={modalS.challengePrompt}>
                Комната "{accessTarget.name || "Безымянный канал"}" защищена паролем.
              </p>
              <Input
                label='Пароль'
                placeholder='Введите пароль'
                value={accessPassword}
                type='password'
                onChange={(event) => {
                  setAccessPassword(event.target.value);
                  if (accessError) setAccessError("");
                }}
                maxLength={32}
                required
              />
              {accessError && <div className={s.formError}>{accessError}</div>}
            </div>

            <div className={modalS.modalActions}>
              <Button type='button' variant='ghost' onClick={handleCloseAccessModal}>
                Отмена
              </Button>
              <Button type='button' onClick={handleConfirmAccess}>
                Войти
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
