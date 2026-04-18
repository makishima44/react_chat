import { FormEvent, useEffect, useState } from "react";
import { updateProfile, User } from "firebase/auth";

import { getNicknameError } from "@/shared/lib/validation";
import { useAppPreferences } from "@/shared/model/preferences";

export const useUserSettings = (authUser: User | null) => {
  const [nickname, setNickname] = useState(authUser?.displayName ?? "");
  const [nicknameError, setNicknameError] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useAppPreferences();

  const openSettings = () => {
    setNickname(authUser?.displayName ?? "");
    setNicknameError("");
    setSettingsOpen(true);
  };

  const closeSettings = () => {
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

  const handleNicknameSave = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!authUser || savingNickname) return;
    const nextError = getNicknameError(nickname, t);
    setNicknameError(nextError);
    if (nextError) return;

    const trimmed = nickname.trim();
    if (trimmed === (authUser.displayName ?? "")) return;

    setSavingNickname(true);
    try {
      await updateProfile(authUser, { displayName: trimmed });
      setNickname(trimmed);
      setNicknameError("");
      setSettingsOpen(false);
    } catch {
      setNicknameError(t("nicknameSaveFailed"));
    } finally {
      setSavingNickname(false);
    }
  };

  return {
    nickname,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleNicknameSave,
  };
};
