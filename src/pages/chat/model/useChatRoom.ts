import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { Room } from "@/entities/room/model/types";
import { db } from "@/shared/api/firebase/firebaseConfig";
import type { TranslateFn } from "@/shared/model/preferences";
import type { ChatRoomStatus } from "./types";

export const useChatRoom = (roomId: string | undefined, t: TranslateFn) => {
  const [roomName, setRoomName] = useState("");
  const [roomDetails, setRoomDetails] = useState<Room | null>(null);
  const [roomStatus, setRoomStatus] = useState<ChatRoomStatus>("loading");

  useEffect(() => {
    if (!roomId) return;

    setRoomStatus("loading");
    setRoomName("");
    setRoomDetails(null);

    const unsubscribe = onSnapshot(
      doc(db, "rooms", roomId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoomStatus("missing");
          setRoomName("");
          setRoomDetails(null);
          return;
        }

        const data = snapshot.data() as Omit<Room, "id">;
        setRoomName(data?.name ?? t("chatTitle"));
        setRoomDetails({ id: snapshot.id, ...data });
        setRoomStatus("ready");
      },
      () => {
        setRoomDetails(null);
        setRoomStatus("missing");
      },
    );

    return () => unsubscribe();
  }, [roomId, t]);

  return {
    roomName,
    roomDetails,
    roomStatus,
  };
};
