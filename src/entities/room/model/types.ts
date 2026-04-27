import type { Timestamp } from "firebase/firestore";

export type RoomRole = "owner" | "moderator" | "member";

export type RoomMember = {
  userId: string;
  userName: string;
  role: RoomRole;
  joinedAt?: Timestamp | null;
};

export type Room = {
  id: string;
  name: string;
  createdAt: Timestamp | null;
  createdBy?: string;
  createdByName?: string;
  password?: string;
  members?: Record<string, RoomMember>;
  roles?: Record<string, RoomRole>;
  unreadCount?: number;
};
