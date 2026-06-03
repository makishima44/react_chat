import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import type { Room, RoomMember, RoomRole } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { TranslateFn } from "@/shared/model/preferences";
import { getPermissionError } from "./firebaseErrors";

type UseRoomRoleManagementParams = {
  roomId?: string;
  roomDetails: Room | null;
  canManageCurrentRoom: boolean;
  onError: (message: string) => void;
  t: TranslateFn;
};

export const useRoomRoleManagement = ({ roomId, roomDetails, canManageCurrentRoom, onError, t }: UseRoomRoleManagementParams) => {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  const handleChangeRole = async (member: RoomMember, role: RoomRole) => {
    if (!roomId || !roomDetails || !canManageCurrentRoom || member.role === "owner" || role === "owner" || member.role === role) return;

    setUpdatingRoleUserId(member.userId);
    onError("");

    try {
      await setDoc(
        doc(db, "rooms", roomId),
        {
          roles: {
            [member.userId]: role,
          },
          members: {
            [member.userId]: {
              ...member,
              role,
            },
          },
        },
        { merge: true },
      );
    } catch (error) {
      onError(getPermissionError(error, t("roomRolesDenied"), t("roomRolesFailed")));
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  return {
    rolesOpen,
    updatingRoleUserId,
    openRoles: () => setRolesOpen(true),
    closeRoles: () => setRolesOpen(false),
    handleChangeRole,
  };
};
