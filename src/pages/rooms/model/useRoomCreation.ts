import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { NavigateFunction } from "react-router-dom";

import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

type UseRoomCreationParams = {
  currentUserId: string;
  currentUserName: string;
  navigate: NavigateFunction;
};

export const useRoomCreation = ({ currentUserId, currentUserName, navigate }: UseRoomCreationParams) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const { t } = useAppPreferences();

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
    if (creating) return;

    const trimmed = newRoomName.trim();
    const trimmedPassword = newRoomPassword.trim();
    if (!trimmed) {
      setCreateError(t("roomCreateNameRequired"));
      return;
    }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setCreateError(t("roomCreateNameLength"));
      return;
    }
    if (!trimmedPassword) {
      setCreateError(t("roomCreatePasswordRequired"));
      return;
    }
    if (trimmedPassword.length < 4 || trimmedPassword.length > 32) {
      setCreateError(t("roomCreatePasswordLength"));
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
        roles: {
          [currentUserId]: "owner",
        },
        members: {
          [currentUserId]: {
            userId: currentUserId,
            userName: currentUserName,
            role: "owner",
            joinedAt: serverTimestamp(),
          },
        },
      });
      setNewRoomName("");
      setNewRoomPassword("");
      navigate(`/chat/${docRef.id}`);
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setCreateError(t("roomCreateDenied"));
      } else {
        setCreateError(t("roomCreateFailed"));
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
