import { useState } from "react";
import { NavigateFunction } from "react-router-dom";

import type { Room } from "@/entities/room/model/types";

type UseRoomAccessParams = {
  challengeOpen: boolean;
  navigate: NavigateFunction;
  clearDeleteError?: () => void;
};

export const useRoomAccess = ({ challengeOpen, navigate, clearDeleteError }: UseRoomAccessParams) => {
  const [accessTarget, setAccessTarget] = useState<Room | null>(null);
  const [accessPassword, setAccessPassword] = useState("");
  const [accessError, setAccessError] = useState("");

  const handleOpenRoom = (roomId: string, room?: Room) => {
    if (challengeOpen) return;
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
