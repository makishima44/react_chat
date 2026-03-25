import type { Message } from "@/entities/message/model/types";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";

type DeleteMessageModalProps = {
  message: Message;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteMessageModal = ({ message, deleting, onClose, onConfirm }: DeleteMessageModalProps) => {
  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-message-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="delete-message-title">
            Delete Message
          </h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close delete confirmation">
            ×
          </button>
        </div>

        <div className={s.deleteMessageBody}>
          <p className={s.deleteMessagePrompt}>Are you sure you want to delete this message?</p>
          <p className={s.deleteMessagePreview}>{message.text}</p>
        </div>

        <div className={s.modalActions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};
