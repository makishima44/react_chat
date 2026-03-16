import type { Timestamp } from "firebase/firestore";

export type Message = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  user: string;
  userId?: string;
  userName?: string;
};
