import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "./firebaseConfig";
import { createSearchPrefixes } from "@/shared/lib/searchPrefixes";

export const syncUserProfile = async (user: User) => {
  const email = user.email?.trim() ?? "";
  const displayName = user.displayName?.trim() || email || "anonymous@node";
  const userRef = doc(db, "users", user.uid);
  const existingProfile = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      email,
      emailLower: email.toLocaleLowerCase(),
      displayName,
      displayNameLower: displayName.toLocaleLowerCase(),
      searchPrefixes: createSearchPrefixes(displayName, email, email.split("@")[0] ?? ""),
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: existingProfile.exists() ? existingProfile.data().createdAt ?? serverTimestamp() : serverTimestamp(),
    },
    { merge: true },
  );
};
