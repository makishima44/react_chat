import type { Room } from "@/entities/room/model/types";
import { Button } from "@/shared/ui/button";

import s from "../roomsPage.module.css";
import modalS from "@/pages/chat/ui/chatPage.module.css";

type DeleteRoomModalProps = {
  deleteTarget: Room;
  deletingRoomId: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteRoomModal = ({ deleteTarget, deletingRoomId, onClose, onConfirm }: DeleteRoomModalProps) => {
  return (
    <div className={modalS.modalOverlay} onClick={onClose}>
      <div className={modalS.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-room-title">
        <div className={modalS.modalHeader}>
          <h2 className={modalS.modalTitle} id="delete-room-title">
            Удалить комнату
          </h2>
          <button type="button" className={modalS.modalClose} onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className={s.deleteModalBody}>
          <p className={modalS.challengePrompt}>Вы уверены, что хотите удалить комнату "{deleteTarget.name || "Безымянный канал"}"?</p>
          <p className={modalS.challengePrompt}>Все сообщения этой комнаты будут удалены без возможности восстановления.</p>
        </div>

        <div className={modalS.modalActions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={!!deletingRoomId}>
            Отмена
          </Button>
          <Button type="button" className={s.dangerAction} onClick={onConfirm} disabled={!!deletingRoomId}>
            {deletingRoomId ? "Удаляю..." : "Удалить"}
          </Button>
        </div>
      </div>
    </div>
  );
};
