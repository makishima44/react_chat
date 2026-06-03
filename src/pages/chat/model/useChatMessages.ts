import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { Message } from "@/entities/message/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { TranslateFn } from "@/shared/model/preferences";
import { isMessageMentioningUser } from "./mentions";
import { getMessagesSyncError } from "./firebaseErrors";
import type { ChatRoomStatus, NotificationPermissionState } from "./types";

type UseChatMessagesParams = {
  roomId?: string;
  roomName: string;
  roomStatus: ChatRoomStatus;
  authUser: User | null;
  mentionAliases: string[];
  notificationPermission: NotificationPermissionState;
  isOwnMessage: (message: Message) => boolean;
  onError: (message: string) => void;
  t: TranslateFn;
};

export const useChatMessages = ({
  roomId,
  roomName,
  roomStatus,
  authUser,
  mentionAliases,
  notificationPermission,
  isOwnMessage,
  onError,
  t,
}: UseChatMessagesParams) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    knownMessageIdsRef.current = new Set();
    notifiedMessageIdsRef.current = new Set();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || roomStatus !== "ready" || messages.length === 0 || typeof window === "undefined") return;

    const latestMessage = [...messages].reverse().find((message) => message.createdAt);
    const latestMessageAt = latestMessage?.createdAt?.toMillis();
    if (!latestMessageAt || !authUser) return;

    const storageKey = `react_chat_last_seen_${authUser.uid}`;

    try {
      const raw = window.localStorage.getItem(storageKey);
      const currentValue = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const previousSeen = currentValue[roomId] ?? 0;

      if (latestMessageAt > previousSeen) {
        window.localStorage.setItem(storageKey, JSON.stringify({ ...currentValue, [roomId]: latestMessageAt }));
      }
    } catch {
      // Local persistence should not affect chat behavior.
    }
  }, [authUser, messages, roomId, roomStatus]);

  useEffect(() => {
    if (!roomId || roomStatus === "missing") {
      setMessages([]);
      return;
    }

    const messagesQuery = query(collection(db, "messages"), where("roomId", "==", roomId), orderBy("createdAt"));
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Message, "id">),
        }));

        const previousMessageIds = knownMessageIdsRef.current;
        const nextMessageIds = new Set(nextMessages.map((message) => message.id));
        const isInitialSync = previousMessageIds.size === 0;
        const newMessages = isInitialSync ? [] : nextMessages.filter((message) => !previousMessageIds.has(message.id));
        knownMessageIdsRef.current = nextMessageIds;

        if (notificationPermission === "granted" && document.visibilityState !== "visible") {
          newMessages.forEach((message) => {
            if (notifiedMessageIdsRef.current.has(message.id)) return;
            if (isOwnMessage(message)) return;
            if (!isMessageMentioningUser(message.text, mentionAliases)) return;

            const author = message.userName || message.user || t("commonAnonymous");
            const textPreview = message.text.length > 120 ? `${message.text.slice(0, 120)}...` : message.text;
            const title = roomName ? t("mentionNotificationTitle", { room: roomName }) : t("mentionNotificationTitleFallback");

            const mentionNotification = new Notification(title, {
              body: `${author}: ${textPreview}`,
              tag: `mention-${message.id}`,
            });

            mentionNotification.onclick = () => {
              window.focus();
              mentionNotification.close();
            };

            window.setTimeout(() => mentionNotification.close(), 7000);
            notifiedMessageIdsRef.current.add(message.id);
          });
        }

        setMessages(nextMessages);
      },
      (error) => {
        onError(getMessagesSyncError(error, t));
      },
    );

    return () => unsubscribe();
  }, [isOwnMessage, mentionAliases, notificationPermission, onError, roomId, roomName, roomStatus, t]);

  return messages;
};
