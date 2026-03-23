import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { NavigateFunction } from "react-router-dom";

import { db } from "@/shared/api/firebase/firebaseConfig";

type UseRoomCreationParams = {
  challengeOpen: boolean;
  currentUserId: string;
  currentUserName: string;
  navigate: NavigateFunction;
};

export const useRoomCreation = ({ challengeOpen, currentUserId, currentUserName, navigate }: UseRoomCreationParams) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleRoomNameChange = (value: string) => {
    setNewRoomName(value);
    if (createError) setCreateError("");
  };

  const handleRoomPasswordChange = (value: string) => {
    setNewRoomPassword(value);
    if (createError) setCreateError("");
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

  return {
    newRoomName,
    newRoomPassword,
    createError,
    creating,
    handleRoomNameChange,
    handleRoomPasswordChange,
    handleCreateRoom,
  };
};
