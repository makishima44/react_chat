import { useState } from "react";
import { FirebaseError } from "firebase/app";

import type { Room } from "@/entities/room/model/types";
import { canDeleteRoom } from "@/entities/room/model/roles";
import { deleteRoomWithMessages } from "@/pages/rooms/lib/deleteRoomWithMessages";
import { useAppPreferences } from "@/shared/model/preferences";

type UseRoomDeletionParams = {
  currentUserId: string;
};

export const useRoomDeletion = ({ currentUserId }: UseRoomDeletionParams) => {
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const { t } = useAppPreferences();

  const handleOpenDeleteModal = (room: Room) => {
    if (deletingRoomId) return;

    if (!canDeleteRoom(room, currentUserId)) {
      setDeleteError(t("roomDeleteDenied"));
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
    if (deletingRoomId) return;

    if (!canDeleteRoom(room, currentUserId)) {
      setDeleteError(t("roomDeleteDenied"));
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
        setDeleteError(t("roomDeleteDenied"));
      } else {
        setDeleteError(t("roomDeleteFailed"));
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
