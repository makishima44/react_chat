import { useState } from "react";
import { useLocation } from "react-router-dom";

import type { DirectChat } from "@/entities/direct-chat/model/types";
import type { Room } from "@/entities/room/model/types";
import { getRoomCategoryIcon } from "@/entities/room/model/categoryIcons";
import type { AvatarId } from "@/entities/user/model/avatarOptions";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { DEFAULT_AVATAR_ID, getAvatarIdForUser } from "@/entities/user/model/avatarOptions";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../roomsPage.module.css";

type RoomsSidebarProps = {
  currentUserId: string;
  currentUserName: string;
  avatarId: AvatarId;
  rooms: Room[];
  activeSection?: "rooms" | "direct-messages";
  directChats: DirectChat[];
  onCreateRoom?: () => void;
  onOpenSettings: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => void;
};

export const RoomsSidebar = ({
  currentUserId,
  currentUserName,
  avatarId,
  rooms,
  activeSection = "rooms",
  directChats,
  onCreateRoom,
  onOpenSettings,
  onNavigate,
  onLogout,
}: RoomsSidebarProps) => {
  const { t } = useAppPreferences();
  const { search } = useLocation();
  const view = new URLSearchParams(search).get("view");
  const activeNav = activeSection === "direct-messages" ? "direct-messages" : view === "mine" ? "mine" : "rooms";
  const [profileOpen, setProfileOpen] = useState(false);
  const myRooms = rooms.filter((room) => room.members?.[currentUserId] || room.createdBy === currentUserId);

  return (
    <aside className={s.sidebar}>
      <button className={s.brand} type="button" onClick={() => onNavigate("/rooms")} aria-label="After Hours">
        <span className={s.brandMark} aria-hidden="true">☾</span>
        <span>After<br />Hours</span>
      </button>

      <nav className={s.primaryNav} aria-label={t("roomsNavigationLabel")}>
        <button className={`${s.navItem} ${activeNav === "rooms" ? s.navActive : ""}`} aria-current={activeNav === "rooms" ? "page" : undefined} type="button" onClick={() => onNavigate("/rooms")}>
          <span className={s.navGlyph} aria-hidden="true">⌂</span><span className={s.navText}>{t("roomsFindNav")}</span><span className={s.mobileNavText}>{t("mobileRooms")}</span>
        </button>
        <button className={`${s.navItem} ${activeNav === "mine" ? s.navActive : ""}`} aria-current={activeNav === "mine" ? "page" : undefined} type="button" onClick={() => onNavigate("/rooms?view=mine")}>
          <span className={s.navGlyph} aria-hidden="true">▤</span><span className={s.navText}>{t("roomsMyRooms")}</span><span className={s.mobileNavText}>{t("mobileMyRooms")}</span>
        </button>
        <button className={`${s.navItem} ${activeNav === "direct-messages" ? s.navActive : ""}`} aria-current={activeNav === "direct-messages" ? "page" : undefined} type="button" onClick={() => onNavigate("/dm")}>
          <span className={s.navGlyph} aria-hidden="true">♧</span><span className={s.navText}>{t("directMessagesTitle")}</span><span className={s.mobileNavText}>{t("mobileMessages")}</span>
        </button>
      </nav>

      <div className={s.sidebarSection}>
        <div className={s.sidebarHeading}>
          <span>{t("roomsMyRooms")}</span>
          <button type="button" onClick={onCreateRoom ?? (() => onNavigate("/rooms"))} aria-label={t("roomsCreateSubmit")}>+</button>
        </div>
        {myRooms.slice(0, 6).map((room) => (
          <button className={s.sidebarRoom} key={room.id} type="button" onClick={() => onNavigate(`/chat/${room.id}`)}>
            <span aria-hidden="true">{getRoomCategoryIcon(room.category)}</span><span>{room.name}</span>
            {!!room.unreadCount && <i className={s.sidebarUnread} aria-label={t("roomsUnreadCountTitle", { count: room.unreadCount })} />}
          </button>
        ))}
      </div>

      <div className={s.sidebarSection}>
        <div className={s.sidebarHeading}>
          <span>{t("directMessagesTitle")}</span>
          <button type="button" onClick={() => onNavigate("/dm")} aria-label={t("directMessagesStartTitle")}>+</button>
        </div>
        {directChats.slice(0, 4).map((chat) => {
          const peer = Object.values(chat.memberProfiles ?? {}).find((member) => member.userId !== currentUserId);
          if (!peer) return null;
          return (
            <button className={s.sidebarChat} key={chat.id} type="button" onClick={() => onNavigate(`/dm/${chat.id}`)}>
              <Avatar avatarId={getAvatarIdForUser(peer.userId)} size="small" />
              <span>{peer.displayName || peer.email}</span>
              <i className={s.sidebarStatus} />
            </button>
          );
        })}
      </div>

      <div className={s.sidebarSpacer} />
      <div className={s.profileWrap}>
        {profileOpen && (
          <div className={s.profileMenu}>
            <button type="button" onClick={onOpenSettings}>{t("settingsTitle")}</button>
            <button type="button" onClick={onLogout}>{t("commonLogout")}</button>
          </div>
        )}
        <button type="button" className={s.profileButton} onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
          <Avatar avatarId={avatarId || DEFAULT_AVATAR_ID} size="large" />
          <span className={s.profileText}><strong>{currentUserName}</strong><small>{t("roomsProfileStatus")}</small></span>
          <span className={s.more} aria-hidden="true">⚙</span>
        </button>
      </div>
    </aside>
  );
};
