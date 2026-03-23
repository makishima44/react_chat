import type { KeyboardEvent } from "react";
import clsx from "clsx";

import type { Room } from "@/entities/room/model/types";

import s from "../roomsPage.module.css";

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
  const handleRoomKeyDown = (event: KeyboardEvent<HTMLDivElement>, roomId: string, room: Room) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenRoom(roomId, room);
    }
  };

  return (
    <div className={s.roomsSection}>
      <div className={s.sectionHeader}>
        <h2 className={s.sectionTitle}>Доступные комнаты</h2>
        <span className={s.sectionHint}>{rooms.length} активных</span>
      </div>

      {roomsError && <div className={s.formError}>{roomsError}</div>}
      {deleteError && <div className={s.formError}>{deleteError}</div>}

      {rooms.length === 0 ? (
        <div className={s.emptyState}>Комнат пока нет. Создайте первую.</div>
      ) : (
        <div className={s.roomGrid}>
          {rooms.map((room) => (
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
                <div className={s.roomName}>{room.name || "Безымянный канал"}</div>
                {room.createdBy === currentUserId && (
                  <button
                    type="button"
                    className={s.deleteButton}
                    disabled={deletingRoomId === room.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDeleteModal(room);
                    }}
                  >
                    {deletingRoomId === room.id ? "Удаляю..." : "Удалить"}
                  </button>
                )}
              </div>
              <div className={s.roomMeta}>{room.createdByName ? `Создал: ${room.createdByName}` : "Создатель неизвестен"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
