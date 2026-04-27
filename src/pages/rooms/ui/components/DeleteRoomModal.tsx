import type { Room } from "@/entities/room/model/types";
import { Button } from "@/shared/ui/button";

import s from "../roomsPage.module.css";
import modalS from "@/pages/chat/ui/chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type DeleteRoomModalProps = {
  deleteTarget: Room;
  deletingRoomId: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteRoomModal = ({ deleteTarget, deletingRoomId, onClose, onConfirm }: DeleteRoomModalProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={modalS.modalOverlay} onClick={onClose}>
      <div className={modalS.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-room-title">
        <div className={modalS.modalHeader}>
          <h2 className={modalS.modalTitle} id="delete-room-title">
            {t("roomsDeleteRoomTitle")}
          </h2>
          <button type="button" className={modalS.modalClose} onClick={onClose} aria-label={t("commonCancel")}>
            ×
          </button>
        </div>

        <div className={s.deleteModalBody}>
          <p className={modalS.modalPrompt}>{t("roomsDeleteRoomPrompt", { name: deleteTarget.name || t("roomsUnnamed") })}</p>
          <p className={modalS.modalPrompt}>{t("roomsDeleteRoomWarning")}</p>
        </div>

        <div className={modalS.modalActions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={!!deletingRoomId}>
            {t("commonCancel")}
          </Button>
          <Button type="button" className={s.dangerAction} onClick={onConfirm} disabled={!!deletingRoomId}>
            {deletingRoomId ? t("roomsDeleteSubmitting") : t("commonDelete")}
          </Button>
        </div>
      </div>
    </div>
  );
};
