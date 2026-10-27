import type { Timestamp } from "firebase/firestore";

export type RoomRole = "owner" | "moderator" | "member";
export type RoomCategory = "general" | "tech" | "creative" | "music" | "gaming" | "off-topic";

export type RoomMember = {
  userId: string;
  userName: string;
  avatarId?: string;
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
  category?: RoomCategory;
  description?: string;
  members?: Record<string, RoomMember>;
  roles?: Record<string, RoomRole>;
  unreadCount?: number;
};
