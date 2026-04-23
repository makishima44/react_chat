import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import type { Message } from "@/entities/message/model/types";
import type { Room } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

const getRoomLastSeenStorageKey = (userId: string) => `react_chat_last_seen_${userId}`;

const readRoomLastSeen = (userId: string) => {
  if (typeof window === "undefined") return {} as Record<string, number>;

  try {
    const raw = window.localStorage.getItem(getRoomLastSeenStorageKey(userId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, number>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "number" && Number.isFinite(value)));
  } catch {
    return {};
  }
};

export const useRoomsQuery = (currentUserId: string) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { t } = useAppPreferences();

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRooms = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Room, "id">),
          unreadCount: unreadCounts[docSnapshot.id] ?? 0,
        }));
        setRooms(nextRooms);
        setRoomsError("");
      },
      () => {
        setRoomsError(t("roomsSyncError"));
      },
    );

    return () => unsubscribe();
  }, [t, unreadCounts]);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lastSeenByRoom = readRoomLastSeen(currentUserId);
      const nextUnreadCounts: Record<string, number> = {};

      snapshot.docs.forEach((docSnapshot) => {
        const message = docSnapshot.data() as Omit<Message, "id">;
        const roomId = message.roomId;
        const createdAtMillis = message.createdAt?.toMillis?.();

        if (!roomId || !createdAtMillis) return;
        if (message.userId && message.userId === currentUserId) return;

        const lastSeen = lastSeenByRoom[roomId] ?? 0;
        if (createdAtMillis <= lastSeen) return;

        nextUnreadCounts[roomId] = (nextUnreadCounts[roomId] ?? 0) + 1;
      });

      setUnreadCounts(nextUnreadCounts);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return { rooms, roomsError, setRoomsError };
};
