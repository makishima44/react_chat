import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, setDoc, where } from "firebase/firestore";

import type { DirectChatMemberProfile } from "@/entities/direct-chat/model/types";
import type { UserProfile } from "@/entities/user/model/types";
import { db } from "./firebaseConfig";
import { normalizeSearchQuery } from "@/shared/lib/searchPrefixes";

const buildDirectChatId = (leftUserId: string, rightUserId: string) => [leftUserId, rightUserId].sort().join("__");

export const searchUserProfiles = async (searchValue: string, currentUserId: string) => {
  const normalizedQuery = normalizeSearchQuery(searchValue);
  if (normalizedQuery.length < 2) return [] as UserProfile[];

  const snapshots = await Promise.all([
    getDocs(query(collection(db, "users"), where("searchPrefixes", "array-contains", normalizedQuery), limit(20))),
    normalizedQuery.includes("@") ? getDocs(query(collection(db, "users"), where("emailLower", "==", normalizedQuery), limit(1))) : null,
  ]);

  const [prefixSnapshot, emailSnapshot] = snapshots;
  const docs = [...prefixSnapshot.docs, ...(emailSnapshot?.docs ?? [])];
  const profilesById = new Map<string, UserProfile>();

  docs.forEach((docSnapshot) => {
    const profile = {
      id: docSnapshot.id,
      ...(docSnapshot.data() as Omit<UserProfile, "id">),
    };
    profilesById.set(profile.id, profile);
  });

  return Array.from(profilesById.values())
    .filter((profile) => profile.id !== currentUserId)
    .sort((left, right) => left.displayNameLower.localeCompare(right.displayNameLower))
    .slice(0, 12);
};

export const getOrCreateDirectChat = async (currentUser: DirectChatMemberProfile, targetUser: DirectChatMemberProfile) => {
  const chatId = buildDirectChatId(currentUser.userId, targetUser.userId);
  const chatRef = doc(db, "directChats", chatId);
  const existing = await getDoc(chatRef);

  if (!existing.exists()) {
    await setDoc(chatRef, {
      memberIds: [currentUser.userId, targetUser.userId].sort(),
      memberProfiles: {
        [currentUser.userId]: currentUser,
        [targetUser.userId]: targetUser,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessageText: "",
      lastMessageAt: null,
      lastMessageSenderId: null,
    });
  } else {
    await setDoc(
      chatRef,
      {
        memberProfiles: {
          [currentUser.userId]: currentUser,
          [targetUser.userId]: targetUser,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return chatId;
};

type SendDirectMessageParams = {
  chatId: string;
  currentUser: DirectChatMemberProfile;
  text: string;
  replyTo?: {
    id: string;
    text: string;
    userId: string;
    userName: string;
  } | null;
};

export const sendDirectMessage = async ({ chatId, currentUser, text, replyTo }: SendDirectMessageParams) => {
  const trimmed = text.trim();
  if (!trimmed) return;

  const chatRef = doc(db, "directChats", chatId);
  const messagesRef = collection(chatRef, "messages");

  await addDoc(messagesRef, {
    text: trimmed,
    createdAt: serverTimestamp(),
    editedAt: null,
    userId: currentUser.userId,
    userName: currentUser.displayName,
    replyTo: replyTo ?? null,
  });

  await setDoc(
    chatRef,
    {
      memberProfiles: {
        [currentUser.userId]: currentUser,
      },
      updatedAt: serverTimestamp(),
      lastMessageText: trimmed,
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: currentUser.userId,
    },
    { merge: true },
  );
};

export const syncDirectChatSummary = async (chatId: string) => {
  const chatRef = doc(db, "directChats", chatId);
  const latestMessageQuery = query(collection(db, "directChats", chatId, "messages"), orderBy("createdAt", "desc"), limit(1));
  const snapshot = await getDocs(latestMessageQuery);
  const latestMessage = snapshot.docs[0];

  if (!latestMessage) {
    await setDoc(
      chatRef,
      {
        updatedAt: serverTimestamp(),
        lastMessageText: "",
        lastMessageAt: null,
        lastMessageSenderId: null,
      },
      { merge: true },
    );
    return;
  }

  const data = latestMessage.data() as { text?: string; createdAt?: unknown; userId?: string };
  await setDoc(
    chatRef,
    {
      updatedAt: serverTimestamp(),
      lastMessageText: data.text ?? "",
      lastMessageAt: data.createdAt ?? null,
      lastMessageSenderId: data.userId ?? null,
    },
    { merge: true },
  );
};
