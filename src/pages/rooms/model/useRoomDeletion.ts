import { useState } from "react";
import { FirebaseError } from "firebase/app";

import type { Room } from "@/entities/room/model/types";
import { deleteRoomWithMessages } from "@/pages/rooms/lib/deleteRoomWithMessages";
import { useAppPreferences } from "@/shared/model/preferences";

type UseRoomDeletionParams = {
  challengeOpen: boolean;
  currentUserId: string;
};

export const useRoomDeletion = ({ challengeOpen, currentUserId }: UseRoomDeletionParams) => {
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const { t } = useAppPreferences();

  const handleOpenDeleteModal = (room: Room) => {
    if (challengeOpen || deletingRoomId) return;

    const isOwner = room.createdBy === currentUserId;
    if (!isOwner) {
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
    if (challengeOpen || deletingRoomId) return;

    const isOwner = room.createdBy === currentUserId;
    if (!isOwner) {
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
