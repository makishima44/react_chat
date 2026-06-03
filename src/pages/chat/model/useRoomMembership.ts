import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Room } from "@/entities/room/model/types";
import { getRoomRole } from "@/entities/room/model/roles";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { ChatRoomStatus } from "./types";

type UseRoomMembershipParams = {
  roomId?: string;
  authUser: User | null;
  roomDetails: Room | null;
  roomStatus: ChatRoomStatus;
  currentUserName: string;
};

export const useRoomMembership = ({ roomId, authUser, roomDetails, roomStatus, currentUserName }: UseRoomMembershipParams) => {
  useEffect(() => {
    if (!roomId || !authUser || roomStatus !== "ready" || !roomDetails) return;

    const role = getRoomRole(roomDetails, authUser.uid);
    const currentMember = roomDetails.members?.[authUser.uid];
    if (roomDetails.roles?.[authUser.uid] === role && currentMember?.role === role && currentMember.userName === currentUserName && currentMember.joinedAt) {
      return;
    }

    void setDoc(
      doc(db, "rooms", roomId),
      {
        roles: {
          [authUser.uid]: role,
        },
        members: {
          [authUser.uid]: {
            userId: authUser.uid,
            userName: currentUserName,
            role,
            joinedAt: roomDetails.members?.[authUser.uid]?.joinedAt ?? serverTimestamp(),
          },
        },
      },
      { merge: true },
    ).catch(() => {});
  }, [authUser, currentUserName, roomDetails, roomId, roomStatus]);
};
