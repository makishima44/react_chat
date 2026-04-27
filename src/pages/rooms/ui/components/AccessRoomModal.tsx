import type { Room } from "@/entities/room/model/types";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import s from "../roomsPage.module.css";
import modalS from "@/pages/chat/ui/chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type AccessRoomModalProps = {
  accessTarget: Room;
  accessPassword: string;
  accessError: string;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export const AccessRoomModal = ({
  accessTarget,
  accessPassword,
  accessError,
  onPasswordChange,
  onClose,
  onConfirm,
}: AccessRoomModalProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={modalS.modalOverlay} onClick={onClose}>
      <div className={modalS.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="access-room-title">
        <div className={modalS.modalHeader}>
          <h2 className={modalS.modalTitle} id="access-room-title">
            {t("roomsAccessTitle")}
          </h2>
          <button type="button" className={modalS.modalClose} onClick={onClose} aria-label={t("commonCancel")}>
            ×
          </button>
        </div>

        <div className={s.accessModalBody}>
          <p className={modalS.modalPrompt}>{t("roomsAccessPrompt", { name: accessTarget.name || t("roomsUnnamed") })}</p>
          <Input
            label={t("roomsAccessPasswordLabel")}
            placeholder={t("roomsAccessPasswordPlaceholder")}
            value={accessPassword}
            type="password"
            onChange={(event) => onPasswordChange(event.target.value)}
            maxLength={32}
            required
          />
          {accessError && <div className={s.formError}>{accessError}</div>}
        </div>

        <div className={modalS.modalActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("commonCancel")}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("roomsAccessConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
};
