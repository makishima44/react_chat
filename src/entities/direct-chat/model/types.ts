import type { Timestamp } from "firebase/firestore";

export type DirectChatMemberProfile = {
  userId: string;
  displayName: string;
  email: string;
};

export type DirectChat = {
  id: string;
  memberIds: string[];
  memberProfiles: Record<string, DirectChatMemberProfile>;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastMessageText?: string;
  lastMessageAt?: Timestamp | null;
  lastMessageSenderId?: string;
};

export type DirectMessageReply = {
  id: string;
  text: string;
  userId: string;
  userName: string;
};

export type DirectMessage = {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  editedAt?: Timestamp | null;
  userId: string;
  userName: string;
  replyTo?: DirectMessageReply | null;
};
