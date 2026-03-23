import { useState } from "react";
import { FirebaseError } from "firebase/app";

import type { Room } from "@/entities/room/model/types";
import { deleteRoomWithMessages } from "@/pages/rooms/lib/deleteRoomWithMessages";

type UseRoomDeletionParams = {
  challengeOpen: boolean;
  currentUserId: string;
};

export const useRoomDeletion = ({ challengeOpen, currentUserId }: UseRoomDeletionParams) => {
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

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
      await deleteRoomWithMessages(room.id);
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

  return {
    deletingRoomId,
    deleteError,
    deleteTarget,
    setDeleteError,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
  };
};
