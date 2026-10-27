import type { Room } from "@/entities/room/model/types";
import { canDeleteRoom } from "@/entities/room/model/roles";
import {
  DEFAULT_AVATAR_ID,
  getAvatarIdForUser,
} from "@/entities/user/model/avatarOptions";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../roomsPage.module.css";

type RoomRowProps = {
  room: Room;
  currentUserId: string;
  onOpen: () => void;
  onDelete: () => void;
};

export const RoomRow = ({
  room,
  currentUserId,
  onOpen,
  onDelete,
}: RoomRowProps) => {
  const { t } = useAppPreferences();
  const category = room.category ?? "general";
  const memberCount = Object.keys(room.members ?? {}).length || 1;
  const avatarId = room.createdBy
    ? getAvatarIdForUser(room.createdBy)
    : DEFAULT_AVATAR_ID;

  return (
    <article className={s.roomRow}>
      <button type="button" className={s.roomOpen} onClick={onOpen}>
        <span className={s.roomAvatar}>
          <Avatar avatarId={avatarId} size="medium" />
        </span>
        <span className={s.roomInfo}>
          <strong>{room.name || t("roomsUnnamed")}</strong>
          <span>{room.description || t("roomsDefaultDescription")}</span>
        </span>
        <span className={s.roomMembers}>
          <span>◉</span>
          {memberCount}
        </span>
        <span
          className={`${s.categoryTag} ${s[`category_${category.replace("-", "")}`]}`}
        >
          {t(
            `roomsCategory_${category.replace("-", "")}` as "roomsCategory_general",
          )}
        </span>
        {Boolean(room.unreadCount) && (
          <span className={s.unread}>{room.unreadCount}</span>
        )}
      </button>
      {canDeleteRoom(room, currentUserId) && (
        <button
          className={s.rowMenu}
          type="button"
          onClick={onDelete}
          aria-label={t("commonDelete")}
        >
          ···
        </button>
      )}
    </article>
  );
};
