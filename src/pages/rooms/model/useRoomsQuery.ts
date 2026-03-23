import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

import type { Room } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";

export const useRoomsQuery = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsError, setRoomsError] = useState("");

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
        setRoomsError("Failed to sync rooms. Please refresh.");
      },
    );

    return () => unsubscribe();
  }, []);

  return { rooms, roomsError, setRoomsError };
};
