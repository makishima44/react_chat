import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import type { Room } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

export const useRoomsQuery = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");
  const { t } = useAppPreferences();

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextRooms = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...(docSnapshot.data() as Omit<Room, "id">),
        }));
        setRooms(nextRooms);
        setRoomsError("");
      },
      () => {
        setRoomsError(t("roomsSyncError"));
      },
    );

    return () => unsubscribe();
  }, [t]);

  return { rooms, roomsError, setRoomsError };
};
