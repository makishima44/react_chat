import { useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { NavigateFunction } from "react-router-dom";

import type { Room } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

type UseRoomAccessParams = {
  navigate: NavigateFunction;
  currentUserId: string;
  currentUserName: string;
  clearDeleteError?: () => void;
};

export const useRoomAccess = ({ navigate, currentUserId, currentUserName, clearDeleteError }: UseRoomAccessParams) => {
  const [accessTarget, setAccessTarget] = useState<Room | null>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const { t } = useAppPreferences();

  const handleOpenRoom = (roomId: string, room?: Room) => {
    if (clearDeleteError) clearDeleteError();
    if (accessError) setAccessError("");
    if (room?.password) {
      setAccessTarget(room);
      setAccessPassword("");
      return;
    }
    navigate(`/chat/${roomId}`);
  };

  const handleAccessPasswordChange = (value: string) => {
    setAccessPassword(value);
    if (accessError) setAccessError("");
  };

  const handleCloseAccessModal = () => {
    setAccessTarget(null);
    setAccessPassword("");
    setAccessError("");
  };

  const joinRoom = async (room: Room) => {
    await setDoc(
      doc(db, "rooms", room.id),
      {
        roles: {
          [currentUserId]: room.roles?.[currentUserId] ?? room.members?.[currentUserId]?.role ?? (room.createdBy === currentUserId ? "owner" : "member"),
        },
        members: {
          [currentUserId]: {
            userId: currentUserId,
            userName: currentUserName,
            role: room.roles?.[currentUserId] ?? room.members?.[currentUserId]?.role ?? (room.createdBy === currentUserId ? "owner" : "member"),
            joinedAt: room.members?.[currentUserId]?.joinedAt ?? serverTimestamp(),
          },
        },
      },
      { merge: true },
    );
  };

  const handleConfirmAccess = async () => {
    if (!accessTarget) return;
    const trimmed = accessPassword.trim();
    if (!trimmed) {
      setAccessError(t("roomAccessPasswordRequired"));
      return;
    }
    if (trimmed !== (accessTarget.password ?? "")) {
      setAccessError(t("roomAccessPasswordInvalid"));
      return;
    }
    const targetId = accessTarget.id;
    try {
      await joinRoom(accessTarget);
      handleCloseAccessModal();
      navigate(`/chat/${targetId}`);
    } catch {
      setAccessError(t("roomAccessFailed"));
    }
  };

  return {
    accessTarget,
    accessPassword,
    accessError,
    handleAccessPasswordChange,
    handleOpenRoom,
    handleCloseAccessModal,
    handleConfirmAccess,
    setAccessError,
  };
};
