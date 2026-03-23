import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";

import { db } from "@/shared/api/firebase/firebaseConfig";

export const deleteRoomWithMessages = async (roomId: string) => {
  const messagesQuery = query(collection(db, "messages"), where("roomId", "==", roomId));
  const messagesSnapshot = await getDocs(messagesQuery);
  const messageDocs = messagesSnapshot.docs;
  const batchSize = 450;

  for (let i = 0; i < messageDocs.length; i += batchSize) {
    const batch = writeBatch(db);
    messageDocs.slice(i, i + batchSize).forEach((messageDoc) => {
      batch.delete(messageDoc.ref);
    });
    await batch.commit();
  }

  await deleteDoc(doc(db, "rooms", roomId));
};
