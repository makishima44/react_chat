import { ReactNode, useEffect, useState } from "react";
import clsx from "clsx";
import type { DirectChat } from "@/entities/direct-chat/model/types";
import type { Room } from "@/entities/room/model/types";
import type { AvatarId } from "@/entities/user/model/avatarOptions";
import { getAvatarIdForUser, isAvatarId } from "@/entities/user/model/avatarOptions";
import type { OnlineUser } from "@/pages/chat/model/types";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "./chatWorkspace.module.css";

type MobilePanel = "navigation" | "participants" | null;

type ChatWorkspaceProps = {
  roomId: string;
  roomName: string;
  rooms: Room[];
  directChats: DirectChat[];
  onlineUsers: OnlineUser[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: AvatarId;
  headerControls: ReactNode;
  children: ReactNode;
  onOpenRoom: (room: Room) => void;
  onNavigate: (path: string) => void;
  onOpenSettings: () => void;
  conversationType?: "room" | "direct";
  directChatId?: string;
  peerName?: string;
  peerId?: string;
  peerAvatarId?: string;
};

const getDirectChatPeer = (chat: DirectChat, currentUserId: string) => {
  const peerId = chat.memberIds.find((memberId) => memberId !== currentUserId);
  return peerId ? chat.memberProfiles?.[peerId] : undefined;
};

export const ChatWorkspace = ({
  roomId,
  roomName,
  rooms,
  directChats,
  onlineUsers,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  headerControls,
  children,
  onOpenRoom,
  onNavigate,
  onOpenSettings,
  conversationType = "room",
  directChatId,
  peerName,
  peerId,
  peerAvatarId,
}: ChatWorkspaceProps) => {
  const { t } = useAppPreferences();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const navigationOpen = mobilePanel === "navigation";
  const participantsOpen = mobilePanel === "participants";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobilePanel(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openRoom = (room: Room) => {
    setMobilePanel(null);
    onOpenRoom(room);
  };

  const openPath = (path: string) => {
    setMobilePanel(null);
    onNavigate(path);
  };

  return (
    <section className={clsx(s.workspace, conversationType === "direct" && s.directWorkspace)} aria-label={t("chatWorkspaceLabel")}>
      <header className={s.topbar}>
        <div className={s.brandBlock}>
            <span className={s.brandMark} aria-hidden="true">a</span>
            <span className={s.brandName}>{t("appName")}</span>
          <span className={s.systemState}>
            <span className={s.statusDot} aria-hidden="true" />
            {t("shellReady")}
          </span>
        </div>
        <div className={s.topbarControls}>
          {conversationType === "room" && <button
            type="button"
            className={s.mobilePanelButton}
            aria-expanded={navigationOpen}
            aria-controls="chat-navigation"
            onClick={() => setMobilePanel(navigationOpen ? null : "navigation")}
          >
            {t("chatChannelsShort")}
          </button>}
          {conversationType === "room" && <button
            type="button"
            className={s.mobilePanelButton}
            aria-expanded={participantsOpen}
            aria-controls="chat-participants"
            onClick={() => setMobilePanel(participantsOpen ? null : "participants")}
          >
            {t("chatPeopleShort")}
            <span className={s.onlineCount}>{onlineUsers.length}</span>
          </button>}
          {headerControls}
        </div>
      </header>

      {mobilePanel && <button type="button" className={s.backdrop} onClick={() => setMobilePanel(null)} aria-label={t("chatCloseNavigation")} />}

      <aside id="chat-navigation" className={clsx(s.sidebar, s.navigation, navigationOpen && s.navigationOpen)}>
        <div className={s.navigationScroll}>
          <div className={s.sectionHeading}>
            <span>{t("chatChannels")}</span>
            <span className={s.sectionCount}>{rooms.length}</span>
          </div>
          <nav className={s.linkList} aria-label={t("chatChannels")}>
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                className={clsx(s.navItem, room.id === roomId && s.navItemActive)}
                aria-current={room.id === roomId ? "page" : undefined}
                onClick={() => openRoom(room)}
              >
                <span className={s.channelMark} aria-hidden="true">#</span>
                <span className={s.navLabel}>{room.name || t("roomsUnnamed")}</span>
                {room.unreadCount ? <span className={s.unreadCount}>{room.unreadCount}</span> : null}
              </button>
            ))}
            <button type="button" className={clsx(s.navItem, s.subtleNavItem)} onClick={() => openPath("/rooms")}>
              <span className={s.navLabel}>{t("chatAllChannels")}</span>
              <span className={s.navArrow} aria-hidden="true">›</span>
            </button>
          </nav>

          <div className={s.sectionHeading}>
            <span>{t("directMessagesTitle")}</span>
            <span className={s.sectionCount}>{directChats.length}</span>
          </div>
          <nav className={s.linkList} aria-label={t("directMessagesTitle")}>
            {directChats.map((chat) => {
              const peer = getDirectChatPeer(chat, currentUserId);
              const name = peer?.displayName || peer?.email || t("commonAnonymous");
              return (
                <button key={chat.id} type="button" className={clsx(s.dmItem, conversationType === "direct" && chat.id === directChatId && s.navItemActive)} aria-current={conversationType === "direct" && chat.id === directChatId ? "page" : undefined} onClick={() => openPath(`/dm/${chat.id}`)}>
                  <Avatar avatarId={getAvatarIdForUser(peer?.userId ?? chat.id)} size="small" alt="" />
                  <span className={s.navLabel}>{name}</span>
                </button>
              );
            })}
            <button type="button" className={clsx(s.navItem, s.subtleNavItem)} onClick={() => openPath("/dm")}>
              <span className={s.navLabel}>{t("chatAllDirectMessages")}</span>
              <span className={s.navArrow} aria-hidden="true">›</span>
            </button>
          </nav>
        </div>

        <button type="button" className={s.profileButton} onClick={onOpenSettings} aria-label={t("chatOpenSettingsAria")}>
          <Avatar avatarId={currentUserAvatar} size="medium" alt="" />
          <span className={s.profileCopy}>
            <span className={s.profileName}>{currentUserName}</span>
            <span className={s.profileHint}>{t("settingsTitle")}</span>
          </span>
          <span className={s.profileArrow} aria-hidden="true">›</span>
        </button>
      </aside>

      <main className={s.conversation}>
        <div className={s.roomHeader}>
          <div className={s.roomIdentity}>
            {conversationType === "direct" ? (
              <Avatar avatarId={isAvatarId(peerAvatarId) ? peerAvatarId : getAvatarIdForUser(peerId ?? roomId)} size="medium" alt="" />
            ) : (
              <span className={s.roomHash} aria-hidden="true">#</span>
            )}
            <div className={s.roomTitleCopy}>
              <h1 className={s.roomTitle}>{conversationType === "direct" ? peerName || t("commonAnonymous") : roomName || t("chatTitle")}</h1>
              <p className={s.roomSubtitle}>{conversationType === "direct" ? t("directChatSubtitleFallback") : t("chatRoomSubtitle")}</p>
            </div>
          </div>
          {conversationType === "room" && <div className={s.roomHeaderStatus}>
            <span className={s.statusDot} aria-hidden="true" />
            <span>{t("chatOnline", { count: onlineUsers.length })}</span>
          </div>}
        </div>
        <div className={s.conversationBody}>{children}</div>
      </main>

      {conversationType === "room" && <aside id="chat-participants" className={clsx(s.sidebar, s.participants, participantsOpen && s.participantsOpen)}>
        <div className={s.participantsHeader}>
          <div>
            <p className={s.sectionHeading}>{t("chatParticipants")}</p>
            <p className={s.participantSummary}>{t("chatOnline", { count: onlineUsers.length })}</p>
          </div>
          <span className={s.sectionCount}>{onlineUsers.length}</span>
        </div>
        <div className={s.participantList}>
          {onlineUsers.length === 0 && <p className={s.emptyParticipants}>{t("chatNoParticipants")}</p>}
          {onlineUsers.map((user) => {
            const userName = user.userName || t("commonAnonymous");
            const avatarId = user.userId === currentUserId ? currentUserAvatar : isAvatarId(user.avatarId) ? user.avatarId : getAvatarIdForUser(user.userId || userName);
            return (
              <div key={user.id} className={s.participantRow} title={userName}>
                <Avatar avatarId={avatarId} size="small" alt="" />
                <span className={s.participantCopy}>
                  <span className={s.participantName}>{userName}</span>
                  <span className={s.participantPresence}>{user.isTyping ? t("chatTypingStatus") : t("chatActiveStatus")}</span>
                </span>
                <span className={s.statusDot} aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </aside>}
    </section>
  );
};
