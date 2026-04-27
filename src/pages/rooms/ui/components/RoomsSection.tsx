import type { KeyboardEvent } from "react";
import clsx from "clsx";

import type { Room } from "@/entities/room/model/types";
import { canDeleteRoom, getRoomRole, roomRoleTranslationKeys } from "@/entities/room/model/roles";

import s from "../roomsPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type RoomsSectionProps = {
  rooms: Room[];
  roomsError: string;
  deleteError: string;
  deletingRoomId: string | null;
  currentUserId: string;
  onOpenRoom: (roomId: string, room?: Room) => void;
  onOpenDeleteModal: (room: Room) => void;
};

export const RoomsSection = ({
  rooms,
  roomsError,
  deleteError,
  deletingRoomId,
  currentUserId,
  onOpenRoom,
  onOpenDeleteModal,
}: RoomsSectionProps) => {
  const { t } = useAppPreferences();

  const handleRoomKeyDown = (event: KeyboardEvent<HTMLDivElement>, roomId: string, room: Room) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenRoom(roomId, room);
    }
  };

  return (
    <div className={s.roomsSection}>
      <div className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>{t("roomsSectionTitle")}</h2>
        <span className={s.sectionHint}>{t("roomsSectionActive", { count: rooms.length })}</span>
      </div>

      {roomsError && <div className={s.formError}>{roomsError}</div>}
      {deleteError && <div className={s.formError}>{deleteError}</div>}

      {rooms.length === 0 ? (
        <div className={s.emptyState}>{t("roomsEmpty")}</div>
      ) : (
        <div className={s.roomGrid}>
          {rooms.map((room) => {
            const currentRole = getRoomRole(room, currentUserId);

            return (
              <div
                key={room.id}
                className={clsx(s.roomCard, deletingRoomId === room.id && s.roomCardDisabled)}
                role="button"
                tabIndex={0}
                aria-disabled={deletingRoomId === room.id}
                onClick={() => onOpenRoom(room.id, room)}
                onKeyDown={(event) => handleRoomKeyDown(event, room.id, room)}
              >
                <div className={s.roomHeader}>
                  <div className={s.roomTitleRow}>
                    <div className={s.roomName}>{room.name || t("roomsUnnamed")}</div>
                    {!!room.unreadCount && (
                      <span className={s.unreadBadge} title={t("roomsUnreadCountTitle", { count: room.unreadCount })}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={clsx(s.roleBadge, s[`roleBadge_${currentRole}`])}>
                    {t(roomRoleTranslationKeys[currentRole])}
                  </span>
                  {canDeleteRoom(room, currentUserId) && (
                    <button
                      type="button"
                      className={s.deleteButton}
                      disabled={deletingRoomId === room.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenDeleteModal(room);
                      }}
                    >
                      {deletingRoomId === room.id ? t("roomsDeleteSubmitting") : t("commonDelete")}
                    </button>
                  )}
                </div>
                <div className={s.roomMeta}>
                  {room.createdByName ? t("commonCreatedBy", { name: room.createdByName }) : t("commonUnknownCreator")}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
