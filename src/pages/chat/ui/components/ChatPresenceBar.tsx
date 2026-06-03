import type { OnlineUser, NotificationPermissionState } from "@/pages/chat/model/types";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../chatPage.module.css";

type ChatPresenceBarProps = {
  onlineUsers: OnlineUser[];
  typingUsers: OnlineUser[];
  notificationPermission: NotificationPermissionState;
  onEnableNotifications: () => void;
};

export const ChatPresenceBar = ({ onlineUsers, typingUsers, notificationPermission, onEnableNotifications }: ChatPresenceBarProps) => {
  const { t } = useAppPreferences();
  const typingLabel =
    typingUsers.length > 0
      ? t("chatTyping", { names: typingUsers.map((user) => user.userName || t("commonAnonymous")).join(", ") })
      : "";

  return (
    <div className={s.presenceBar}>
      <div className={s.presenceSummary}>
        <span className={s.onlineState}>{t("chatOnline", { count: onlineUsers.length })}</span>
        {typingLabel && <span className={s.typingState}>{typingLabel}</span>}
      </div>
      {onlineUsers.length > 0 && (
        <div className={s.participants} aria-label={t("chatParticipants")}>
          <span className={s.participantsLabel}>{t("chatParticipants")}:</span>
          <div className={s.participantList}>
            {onlineUsers.map((user) => (
              <span key={user.id} className={s.participantChip} title={user.userName || t("commonAnonymous")}>
                {user.userName || t("commonAnonymous")}
              </span>
            ))}
          </div>
        </div>
      )}
      {notificationPermission === "default" && (
        <button type="button" className={s.notificationButton} onClick={onEnableNotifications}>
          {t("chatEnableMentionAlerts")}
        </button>
      )}
      {notificationPermission === "granted" && <span className={s.notificationEnabled}>{t("chatMentionAlertsEnabled")}</span>}
      {notificationPermission === "denied" && <span className={s.notificationDenied}>{t("chatMentionAlertsBlocked")}</span>}
    </div>
  );
};
