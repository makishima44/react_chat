import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/shared/api/firebase/firebaseConfig";
import { syncUserProfile } from "@/shared/api/firebase/syncUserProfile";

export const UserProfileBootstrap = () => {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;

    void syncUserProfile(user).catch(() => {});
  }, [user]);

  return null;
};
