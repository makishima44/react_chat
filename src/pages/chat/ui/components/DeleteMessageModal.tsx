import type { Message } from "@/entities/message/model/types";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type DeleteMessageModalProps = {
  message: Message;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteMessageModal = ({ message, deleting, onClose, onConfirm }: DeleteMessageModalProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-message-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="delete-message-title">
            {t("chatDeleteTitle")}
          </h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label={t("chatDeleteCloseAria")}>
            ×
          </button>
        </div>

        <div className={s.deleteMessageBody}>
          <p className={s.deleteMessagePrompt}>{t("chatDeletePrompt")}</p>
          <p className={s.deleteMessagePreview}>{message.text}</p>
        </div>

        <div className={s.modalActions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={deleting}>
            {t("commonCancel")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={deleting}>
            {deleting ? t("chatDeleteSubmitting") : t("commonDelete")}
          </Button>
        </div>
      </div>
    </div>
  );
};
