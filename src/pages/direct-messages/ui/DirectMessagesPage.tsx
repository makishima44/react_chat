import { signOut } from "firebase/auth";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { UserProfile } from "@/entities/user/model/types";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { getOrCreateDirectChat, searchUserProfiles } from "@/shared/api/firebase/directChats";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { RoomsSidebar } from "@/pages/rooms/ui/components/RoomsSidebar";
import { useUserSettings } from "@/pages/rooms/model/useUserSettings";
import { useAppPreferences } from "@/shared/model/preferences";
import { useDirectChatsQuery } from "../model/useDirectChatsQuery";
import { useRoomsQuery } from "@/pages/rooms/model/useRoomsQuery";
import { DirectChatsSection } from "./components/DirectChatsSection";
import { UserSearchPanel } from "./components/UserSearchPanel";

import s from "./directMessagesPage.module.css";
import shell from "@/pages/rooms/ui/roomsPage.module.css";

export const DirectMessagesPage = () => {
  const navigate = useNavigate();
  const authUser = auth.currentUser;
  const { t } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserEmail = authUser?.email ?? "";
  const currentUserName = authUser?.displayName?.trim() || currentUserEmail || t("commonAnonymous");
  const settings = useUserSettings(authUser);
  const { rooms } = useRoomsQuery(currentUserId, { trackUnreadCounts: false });
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [directChatActionId, setDirectChatActionId] = useState<string | null>(null);
  const { directChats, directChatsError } = useDirectChatsQuery(currentUserId);

  const currentMemberProfile = useMemo(
    () => ({
      userId: currentUserId,
      displayName: currentUserName,
      email: currentUserEmail,
      avatarId: settings.avatarId,
    }),
    [settings.avatarId, currentUserEmail, currentUserId, currentUserName],
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
        avatarId: profile.avatarId,
      });
      navigate(`/dm/${chatId}`);
    } catch {
      setSearchError(t("directMessagesCreateFailed"));
    } finally {
      setDirectChatActionId(null);
    }
  };

  return (
    <main className={shell.shell}>
      <RoomsSidebar
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        avatarId={settings.avatarId}
        rooms={rooms}
        activeSection="direct-messages"
        directChats={directChats}
        onOpenSettings={settings.openSettings}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
      <section className={shell.main}>
        <header className={shell.topbar}>
          <span>{t("directMessagesBreadcrumb")}</span>
          <button type="button" className={shell.mobileProfile} onClick={settings.openSettings} aria-label={t("chatOpenSettingsAria")}>
            <Avatar avatarId={settings.avatarId} size="small" />
          </button>
        </header>
        <div className={shell.content}>
          <div className={shell.welcome}>
            <div>
              <p className={shell.eyebrow}>{t("directMessagesEyebrow")}</p>
              <h1>{t("directMessagesHeading")}</h1>
              <p>{t("directMessagesDescription")}</p>
            </div>
          </div>
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
        </div>
      </section>

      {settings.settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={settings.nickname}
          avatarId={settings.avatarId}
          nicknameError={settings.nicknameError}
          savingNickname={settings.savingNickname}
          currentUserName={currentUserName}
          onClose={settings.closeSettings}
          onSubmit={settings.handleNicknameSave}
          onNicknameChange={settings.handleNicknameChange}
          onAvatarChange={settings.handleAvatarChange}
        />
      )}
    </main>
  );
};
