import { useState } from "react";

import type { DirectChat } from "@/entities/direct-chat/model/types";
import type { AvatarId } from "@/entities/user/model/avatarOptions";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import {
  DEFAULT_AVATAR_ID,
  getAvatarIdForUser,
} from "@/entities/user/model/avatarOptions";
import { useAppPreferences, type AppTheme } from "@/shared/model/preferences";
import s from "../roomsPage.module.css";

type RoomsSidebarProps = {
  currentUserId: string;
  currentUserName: string;
  avatarId: AvatarId;
  roomCount: number;
  directMessagesCount?: number;
  activeSection?: "rooms" | "direct-messages";
  directChats: DirectChat[];
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenSettings: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export const RoomsSidebar = ({
  currentUserId,
  currentUserName,
  avatarId,
  roomCount,
  directMessagesCount = 0,
  activeSection = "rooms",
  directChats,
  theme,
  onThemeChange,
  onOpenSettings,
  onNavigate,
  onLogout,
}: RoomsSidebarProps) => {
  const { t } = useAppPreferences();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <aside className={s.sidebar}>
      <button
        className={s.brand}
        type="button"
        onClick={() => onNavigate("/rooms")}
      >
        <span className={s.brandMark}>a</span>
        <span>after hours</span>
      </button>
      <div className={s.navLabel}>{t("roomsNavWorkspace")}</div>
      <button
        className={`${s.navItem} ${activeSection === "rooms" ? s.navActive : ""}`}
        type="button"
        onClick={() => onNavigate("/rooms")}
        aria-current={activeSection === "rooms" ? "page" : undefined}
      >
        <span className={s.navGlyph}>▦</span>
        {t("commonRooms")}
        <span className={s.navCount}>{roomCount}</span>
      </button>
      <button
        className={`${s.navItem} ${activeSection === "direct-messages" ? s.navActive : ""}`}
        type="button"
        onClick={() => onNavigate("/dm")}
        aria-current={activeSection === "direct-messages" ? "page" : undefined}
      >
        <span className={s.navGlyph}>▤</span>
        {t("directMessagesNav")}
        {directMessagesCount > 0 && <span className={s.navCount}>{directMessagesCount}</span>}
      </button>
      <button className={s.navItem} type="button" onClick={onOpenSettings}>
        <span className={s.navGlyph}>⚙</span>
        {t("settingsTitle")}
      </button>
      {directChats.length > 0 && (
        <div className={s.recentChats}>
          <div className={s.navLabel}>{t("roomsRecentChats")}</div>
          {directChats.slice(0, 4).map((chat) => {
            const peer = Object.values(chat.memberProfiles ?? {}).find(
              (member) => member.userId !== currentUserId,
            );
            if (!peer) return null;
            return (
              <button
                key={chat.id}
                type="button"
                className={s.recentChat}
                onClick={() => onNavigate(`/dm/${chat.id}`)}
              >
                <Avatar
                  avatarId={getAvatarIdForUser(peer.userId)}
                  size="small"
                />
                <span>{peer.displayName || peer.email}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className={s.sidebarSpacer} />
      <div className={s.profileWrap}>
        {profileOpen && (
          <div className={s.profileMenu}>
            <div className={s.menuUser}>
              <Avatar avatarId={avatarId || DEFAULT_AVATAR_ID} size="small" />
              <span>{currentUserName}</span>
            </div>
            <button type="button" onClick={onOpenSettings}>
              {t("settingsTitle")}
            </button>
            <div className={s.themeOptions}>
              <span>{t("prefsTheme")}</span>
              <button
                className={theme === "amber" ? s.selectedTheme : ""}
                onClick={() => onThemeChange("amber")}
                type="button"
              >
                Amber
              </button>
              <button
                className={theme === "purple" ? s.selectedTheme : ""}
                onClick={() => onThemeChange("purple")}
                type="button"
              >
                Purple
              </button>
            </div>
            <button type="button" onClick={onLogout}>
              {t("commonLogout")}
            </button>
          </div>
        )}
        <button
          type="button"
          className={s.profileButton}
          onClick={() => setProfileOpen((open) => !open)}
          aria-expanded={profileOpen}
        >
          <Avatar avatarId={avatarId || DEFAULT_AVATAR_ID} size="small" />
          <span className={s.profileText}>
            <strong>{currentUserName}</strong>
            <small>{t("roomsProfileStatus")}</small>
          </span>
          <span className={s.more}>···</span>
        </button>
      </div>
    </aside>
  );
};
