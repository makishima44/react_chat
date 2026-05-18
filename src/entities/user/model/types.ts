import type { Timestamp } from "firebase/firestore";

export type UserProfile = {
  id: string;
  email: string;
  emailLower: string;
  displayName: string;
  displayNameLower: string;
  searchPrefixes: string[];
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastSeenAt?: Timestamp | null;
};
