import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import type { DirectChat } from "@/entities/direct-chat/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

export const useDirectChatsQuery = (currentUserId: string) => {
  const [directChats, setDirectChats] = useState<DirectChat[]>([]);
  const [directChatsError, setDirectChatsError] = useState("");
  const { t } = useAppPreferences();

  useEffect(() => {
    if (!currentUserId || currentUserId === "anonymous") {
      setDirectChats([]);
      return;
    }

    const directChatsQuery = query(collection(db, "directChats"), where("memberIds", "array-contains", currentUserId));
    const unsubscribe = onSnapshot(
      directChatsQuery,
      (snapshot) => {
        const nextChats = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<DirectChat, "id">),
        }));

        nextChats.sort((left, right) => {
          const leftTime = left.updatedAt?.toMillis?.() ?? 0;
          const rightTime = right.updatedAt?.toMillis?.() ?? 0;
          return rightTime - leftTime;
        });

        setDirectChats(nextChats);
        setDirectChatsError("");
      },
      () => {
        setDirectChatsError(t("directChatsSyncFailed"));
      },
    );

    return () => unsubscribe();
  }, [currentUserId, t]);

  return {
    directChats,
    directChatsError,
  };
};
