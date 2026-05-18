import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { UserProfile } from "@/entities/user/model/types";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { getOrCreateDirectChat, searchUserProfiles } from "@/shared/api/firebase/directChats";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { ChatHeaderControls } from "@/pages/chat/ui/components/ChatHeaderControls";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { useAppPreferences } from "@/shared/model/preferences";
import { useDirectChatsQuery } from "../model/useDirectChatsQuery";
import { DirectChatsSection } from "./components/DirectChatsSection";
import { UserSearchPanel } from "./components/UserSearchPanel";

import s from "./directMessagesPage.module.css";

export const DirectMessagesPage = () => {
  const navigate = useNavigate();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [directChatActionId, setDirectChatActionId] = useState<string | null>(null);
  const { directChats, directChatsError } = useDirectChatsQuery(currentUserId);
  const {
    nickname,
    nicknameError,
    savingNickname,
    settingsOpen,
    openSettings,
    closeSettings,
    handleNicknameChange,
    handleNicknameSave,
  } = useUserSettings(authUser);

  const currentMemberProfile = useMemo(
    () => ({
      userId: currentUserId,
      displayName: currentUserName,
      email: currentUserEmail,
    }),
    [currentUserEmail, currentUserId, currentUserName],
  );

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setSearchError(t("logoutError"));
    }
  };

  const handleSearchSubmit = async () => {
    const trimmed = searchValue.trim();
    if (trimmed.length < 2) {
      setSearchError(t("directMessagesSearchTooShort"));
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      const nextResults = await searchUserProfiles(trimmed, currentUserId);
      setSearchResults(nextResults);
      if (nextResults.length === 0) {
        setSearchError(t("directMessagesSearchNoUsers"));
      }
    } catch {
      setSearchError(t("directMessagesSearchFailed"));
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartDirectChat = async (profile: UserProfile) => {
    if (!authUser || directChatActionId) return;

    setDirectChatActionId(profile.id);
    setSearchError("");

    try {
      const chatId = await getOrCreateDirectChat(currentMemberProfile, {
        userId: profile.id,
        displayName: profile.displayName,
        email: profile.email,
      });
      navigate(`/dm/${chatId}`);
    } catch {
      setSearchError(t("directMessagesCreateFailed"));
    } finally {
      setDirectChatActionId(null);
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("directMessagesTitle")}
        subtitle={t("directMessagesSubtitle")}
        headerSlot={
          <ChatHeaderControls
            onOpenSettings={openSettings}
            onGoToRooms={() => navigate("/rooms")}
            onGoToDirectMessages={() => navigate("/dm")}
            onLogout={handleLogout}
          />
        }
        className={s.directMessagesFrame}
      >
        <div className={s.grid}>
          <UserSearchPanel
            searchValue={searchValue}
            searchError={searchError}
            searchLoading={searchLoading || !!directChatActionId}
            searchResults={searchResults}
            onSearchValueChange={(value) => {
              setSearchValue(value);
              setSearchError("");
            }}
            onSearchSubmit={handleSearchSubmit}
            onStartDirectChat={handleStartDirectChat}
          />

          <div className={s.chatColumn}>
            {directChatsError && <div className={s.formError}>{directChatsError}</div>}
            <DirectChatsSection directChats={directChats} currentUserId={currentUserId} onOpenChat={(chatId) => navigate(`/dm/${chatId}`)} />
          </div>
        </div>
      </TerminalFrame>

      {settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={nickname}
          nicknameError={nicknameError}
          savingNickname={savingNickname}
          currentUserName={currentUserName}
          onClose={closeSettings}
          onSubmit={handleNicknameSave}
          onNicknameChange={handleNicknameChange}
        />
      )}
    </div>
  );
};
