import type { Timestamp } from "firebase/firestore";

export type Room = {
  id: string;
  name: string;
  createdAt: Timestamp | null;
  createdBy?: string;
  createdByName?: string;
  password?: string;
  unreadCount?: number;
};
