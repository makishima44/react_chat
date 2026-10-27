import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { NavigateFunction } from "react-router-dom";

import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";
import type { RoomCategory } from "@/entities/room/model/types";

type UseRoomCreationParams = {
  currentUserId: string;
  currentUserName: string;
  navigate: NavigateFunction;
};

export const useRoomCreation = ({
  currentUserId,
  currentUserName,
  navigate,
}: UseRoomCreationParams) => {
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPassword, setNewRoomPassword] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomCategory, setNewRoomCategory] =
    useState<RoomCategory>("general");
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

  const handleRoomDescriptionChange = (value: string) =>
    setNewRoomDescription(value);
  const handleRoomCategoryChange = (value: RoomCategory) =>
    setNewRoomCategory(value);

  const handleCreateRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (creating) return false;

    const trimmed = newRoomName.trim();
    const trimmedPassword = newRoomPassword.trim();
    if (!trimmed) {
      setCreateError(t("roomCreateNameRequired"));
      return false;
    }
    if (trimmed.length < 2 || trimmed.length > 40) {
      setCreateError(t("roomCreateNameLength"));
      return false;
    }
    if (
      trimmedPassword &&
      (trimmedPassword.length < 4 || trimmedPassword.length > 32)
    ) {
      setCreateError(t("roomCreatePasswordLength"));
      return false;
    }

    setCreating(true);
    setCreateError("");

    try {
      const docRef = await addDoc(collection(db, "rooms"), {
        name: trimmed,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
        ...(newRoomDescription.trim()
          ? { description: newRoomDescription.trim() }
          : {}),
        category: newRoomCategory,
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
      setNewRoomDescription("");
      setNewRoomCategory("general");
      navigate(`/chat/${docRef.id}`);
      return true;
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "permission-denied") {
        setCreateError(t("roomCreateDenied"));
      } else {
        setCreateError(t("roomCreateFailed"));
      }
      return false;
    } finally {
      setCreating(false);
    }
  };

  return {
    newRoomName,
    newRoomPassword,
    newRoomDescription,
    newRoomCategory,
    createError,
    creating,
    handleRoomNameChange,
    handleRoomPasswordChange,
    handleRoomDescriptionChange,
    handleRoomCategoryChange,
    handleCreateRoom,
  };
};
