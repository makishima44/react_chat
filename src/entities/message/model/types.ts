import type { Timestamp } from "firebase/firestore";

export type MessageReply = {
  id: string;
  text: string;
  user?: string;
  userName?: string;
};

export type Message = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
  user: string;
  userId?: string;
  userName?: string;
  roomId?: string;
  replyTo?: MessageReply | null;
};
