import type { Room } from "@/entities/room/model/types";
import { canDeleteRoom } from "@/entities/room/model/roles";
import { getRoomCategoryIcon } from "@/entities/room/model/categoryIcons";
import { getAvatarIdForUser } from "@/entities/user/model/avatarOptions";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../roomsPage.module.css";

type RoomRowProps = {
  room: Room;
  currentUserId: string;
  onOpen: () => void;
  onDelete: () => void;
};

export const RoomRow = ({ room, currentUserId, onOpen, onDelete }: RoomRowProps) => {
  const { t, language } = useAppPreferences();
  const category = room.category ?? "general";
  const members = Object.values(room.members ?? {});
  const memberCount = members.length || 1;
  const createdAt = room.createdAt?.toDate?.();
  const timeLabel = createdAt
    ? new Intl.RelativeTimeFormat(language, { numeric: "auto" }).format(
        -Math.max(1, Math.round((Date.now() - createdAt.getTime()) / 3600000)),
        "hour",
      )
    : t("roomsJustNow");

  return (
    <article className={s.roomRow}>
      <button type="button" className={s.roomOpen} onClick={onOpen}>
        <span className={`${s.roomAvatar} ${s[`roomAvatar_${category.replace("-", "")}`]}`} aria-hidden="true">
          <span className={s.roomAvatarGlyph}>{getRoomCategoryIcon(category)}</span>
        </span>
        <span className={s.roomInfo}>
          <strong># {room.name || t("roomsUnnamed")}</strong>
          <span className={s.roomDescription}>{room.description || t("roomsDefaultDescription")}</span>
          <span className={s.roomTags}>
            <span className={`${s.categoryTag} ${s[`category_${category.replace("-", "")}`]}`}>
              {t(`roomsCategory_${category.replace("-", "")}` as "roomsCategory_general")}
            </span>
          </span>
        </span>
        <span className={s.roomMembers}>
          <span className={s.memberAvatars} aria-hidden="true">
            {members.slice(0, 4).map((member) => <Avatar key={member.userId} avatarId={getAvatarIdForUser(member.userId)} size="small" />)}
          </span>
          <span>{t("roomsMembersCount", { count: memberCount })}</span>
          <small><i />{t("roomsOnlineHint")}</small>
        </span>
        <span className={s.roomActivity}>
          <span>{timeLabel}</span>
          {!!room.unreadCount && <strong className={s.unread}>{room.unreadCount}</strong>}
        </span>
      </button>
      {canDeleteRoom(room, currentUserId) && (
        <button className={s.rowMenu} type="button" onClick={onDelete} aria-label={t("commonDelete")}>···</button>
      )}
    </article>
  );
};
