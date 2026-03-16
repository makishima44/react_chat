import { FormEvent } from "react";
import type { User } from "firebase/auth";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";

type ChatSettingsModalProps = {
  authUser: User | null;
  nickname: string;
  nicknameError: string;
  savingNickname: boolean;
  currentUserName: string;
  onClose: () => void;
  onSubmit: (event?: FormEvent) => void;
  onNicknameChange: (value: string) => void;
};

export const ChatSettingsModal = ({
  authUser,
  nickname,
  nicknameError,
  savingNickname,
  currentUserName,
  onClose,
  onSubmit,
  onNicknameChange,
}: ChatSettingsModalProps) => {
  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="settings-title">
            Settings
          </h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label="Close settings">
            ×
          </button>
        </div>

        <form className={s.nicknameForm} onSubmit={onSubmit}>
          <div className={s.nicknameField}>
            <label className={s.nicknameLabel} htmlFor="nickname">
              Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              placeholder={currentUserName}
              maxLength={24}
              disabled={!authUser || savingNickname}
              aria-label="Nickname"
            />
            {nicknameError && <div className={s.nicknameError}>{nicknameError}</div>}
          </div>

          <div className={s.modalActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!authUser || savingNickname}>
              {savingNickname ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
