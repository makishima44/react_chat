import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { ChatRoomStatus, OnlineUser } from "./types";

type UseRoomPresenceParams = {
  roomId?: string;
  authUser: User | null;
  roomStatus: ChatRoomStatus;
  currentUserName: string;
};

export const useRoomPresence = ({ roomId, authUser, roomStatus, currentUserName }: UseRoomPresenceParams) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const presenceDocId = roomId && authUser ? `${roomId}_${authUser.uid}` : null;

  const setTypingState = useCallback(
    async (nextTyping: boolean) => {
      if (!presenceDocId || !roomId || !authUser || isTypingRef.current === nextTyping) return;

      isTypingRef.current = nextTyping;
      try {
        await setDoc(
          doc(db, "roomPresence", presenceDocId),
          {
            roomId,
            userId: authUser.uid,
            userName: currentUserName,
            isOnline: true,
            isTyping: nextTyping,
            lastActiveAt: serverTimestamp(),
          },
          { merge: true },
        );
      } catch {
        // Best-effort UI signal; chat should continue to work even if presence write fails.
      }
    },
    [authUser, currentUserName, presenceDocId, roomId],
  );

  const handleTypingInput = useCallback(
    (value: string) => {
      if (!authUser || !roomId || roomStatus !== "ready") return;

      const hasText = value.trim().length > 0;
      if (hasText && !isTypingRef.current) {
        void setTypingState(true);
      }
      if (!hasText && isTypingRef.current) {
        void setTypingState(false);
      }

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      if (hasText) {
        typingTimeoutRef.current = window.setTimeout(() => {
          void setTypingState(false);
        }, 1200);
      } else {
        typingTimeoutRef.current = null;
      }
    },
    [authUser, roomId, roomStatus, setTypingState],
  );

  useEffect(() => {
    if (!roomId || !authUser || roomStatus !== "ready") {
      setOnlineUsers([]);
      return;
    }

    const presenceQuery = query(collection(db, "roomPresence"), where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(
      presenceQuery,
      (snapshot) => {
        const activeUsers = snapshot.docs
          .map((docSnapshot) => ({
            id: docSnapshot.id,
            ...(docSnapshot.data() as { userId?: string; userName?: string; isOnline?: boolean; isTyping?: boolean }),
          }))
          .filter((entry) => entry.isOnline);

        setOnlineUsers(activeUsers);
      },
      () => {
        // Presence issues should not break chat; ignore snapshot error.
      },
    );

    return () => unsubscribe();
  }, [authUser, roomId, roomStatus]);

  useEffect(() => {
    if (!roomId || !authUser || !presenceDocId || roomStatus !== "ready") return;

    const presenceRef = doc(db, "roomPresence", presenceDocId);
    const writePresence = async (isOnline: boolean, isTyping: boolean) => {
      await setDoc(
        presenceRef,
        {
          roomId,
          userId: authUser.uid,
          userName: currentUserName,
          isOnline,
          isTyping,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true },
      );
    };

    void writePresence(true, false).catch(() => {});

    const handleBeforeUnload = () => {
      void writePresence(false, false).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      void writePresence(false, false).catch(() => {});
    };
  }, [authUser, currentUserName, presenceDocId, roomId, roomStatus]);

  const typingUsers = useMemo(() => onlineUsers.filter((user) => user.isTyping && user.userId !== authUser?.uid), [authUser?.uid, onlineUsers]);

  return {
    onlineUsers,
    typingUsers,
    setTypingState,
    handleTypingInput,
  };
};
