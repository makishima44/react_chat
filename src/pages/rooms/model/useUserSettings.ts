import { FormEvent, useEffect, useState } from "react";
import { updateProfile, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

import { DEFAULT_AVATAR_ID, isAvatarId, type AvatarId } from "@/entities/user/model/avatarOptions";
import { getNicknameError } from "@/shared/lib/validation";
import { useAppPreferences } from "@/shared/model/preferences";
import { syncUserProfile } from "@/shared/api/firebase/syncUserProfile";
import { db } from "@/shared/api/firebase/firebaseConfig";

export const useUserSettings = (authUser: User | null) => {
  const [nickname, setNickname] = useState(authUser?.displayName ?? "");
  const [avatarId, setAvatarId] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const [savedAvatarId, setSavedAvatarId] = useState<AvatarId>(DEFAULT_AVATAR_ID);
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useAppPreferences();

  useEffect(() => {
    if (!authUser) {
      setAvatarId(DEFAULT_AVATAR_ID);
      setSavedAvatarId(DEFAULT_AVATAR_ID);
      return;
    }

    return onSnapshot(doc(db, "users", authUser.uid), (snapshot) => {
      const nextAvatarId = snapshot.data()?.avatarId;
      const validAvatarId = isAvatarId(nextAvatarId) ? nextAvatarId : DEFAULT_AVATAR_ID;
      setAvatarId(validAvatarId);
      setSavedAvatarId(validAvatarId);
    });
  }, [authUser]);

  const openSettings = () => {
    setNickname(authUser?.displayName ?? "");
    setAvatarId(savedAvatarId);
    setNicknameError("");
    setSettingsOpen(true);
  };

  const closeSettings = () => {
    setNickname(authUser?.displayName ?? "");
    setAvatarId(savedAvatarId);
    setSettingsOpen(false);
  };

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (nicknameError) {
      setNicknameError("");
    }
  };

  const handleAvatarChange = (value: AvatarId) => {
    setAvatarId(value);
  };

  const handleNicknameSave = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!authUser || savingNickname) return;
    const nextError = getNicknameError(nickname, t);
    setNicknameError(nextError);
    if (nextError) return;

    const trimmed = nickname.trim();
    const nicknameChanged = trimmed !== (authUser.displayName ?? "");
    const avatarChanged = avatarId !== savedAvatarId;
    if (!nicknameChanged && !avatarChanged) {
      setSettingsOpen(false);
      return;
    }

    setSavingNickname(true);
    try {
      if (nicknameChanged) await updateProfile(authUser, { displayName: trimmed });
      await syncUserProfile(authUser);
      if (avatarChanged) await updateDoc(doc(db, "users", authUser.uid), { avatarId });
      setNickname(trimmed);
      setSavedAvatarId(avatarId);
      setNicknameError("");
      setSettingsOpen(false);
    } catch {
      setNicknameError(t("settingsSaveFailed"));
    } finally {
      setSavingNickname(false);
    }
  };

  return {
    nickname,
    avatarId,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleAvatarChange,
    handleNicknameSave,
  };
};
