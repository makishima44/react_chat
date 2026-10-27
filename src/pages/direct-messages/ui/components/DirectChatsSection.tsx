import type { DirectChat } from "@/entities/direct-chat/model/types";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { getAvatarIdForUser } from "@/entities/user/model/avatarOptions";
import { useAppPreferences } from "@/shared/model/preferences";

import s from "../directMessagesPage.module.css";

type DirectChatsSectionProps = {
  directChats: DirectChat[];
  currentUserId: string;
  onOpenChat: (chatId: string) => void;
};

const formatPreviewTime = (value?: DirectChat["lastMessageAt"]) => {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value.toDate());
};

export const DirectChatsSection = ({ directChats, currentUserId, onOpenChat }: DirectChatsSectionProps) => {
  const { t } = useAppPreferences();

  return (
    <section className={s.chatsSection}>
      <div className={s.panelHeader}>
        <h2 className={s.panelTitle}>{t("directMessagesListTitle")}</h2>
        <span className={s.panelHint}>{t("directMessagesListHint", { count: directChats.length })}</span>
      </div>

      {directChats.length === 0 ? (
        <div className={s.emptyState}>{t("directMessagesListEmpty")}</div>
      ) : (
        <div className={s.chatList}>
          {directChats.map((chat) => {
            const peer = Object.values(chat.memberProfiles ?? {}).find((member) => member.userId !== currentUserId);
            if (!peer) return null;

            return (
              <button key={chat.id} type="button" className={s.chatCard} onClick={() => onOpenChat(chat.id)}>
                <Avatar avatarId={getAvatarIdForUser(peer.userId)} size="medium" alt="" />
                <div className={s.chatContent}>
                  <div className={s.chatTop}>
                    <span className={s.chatName}>{peer.displayName || peer.email}</span>
                    <span className={s.chatTime}>{formatPreviewTime(chat.lastMessageAt)}</span>
                  </div>
                  <div className={s.chatEmail}>{peer.email}</div>
                  <div className={s.chatPreview}>{chat.lastMessageText?.trim() || t("directMessagesEmptyPreview")}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
