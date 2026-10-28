import { FormEvent } from "react";
import type { User } from "firebase/auth";
import { Button } from "@/shared/ui/button";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { avatarOptions, type AvatarId } from "@/entities/user/model/avatarOptions";
import s from "../chatPage.module.css";
import p from "./chatSettings.module.css";
import { AppLanguage, useAppPreferences } from "@/shared/model/preferences";

type ChatSettingsModalProps = {
  authUser: User | null;
  nickname: string;
  avatarId: AvatarId;
  nicknameError: string;
  savingNickname: boolean;
  currentUserName: string;
  onClose: () => void;
  onSubmit: (event?: FormEvent) => void;
  onNicknameChange: (value: string) => void;
  onAvatarChange: (value: AvatarId) => void;
};

export const ChatSettingsModal = ({
  authUser,
  nickname,
  avatarId,
  nicknameError,
  savingNickname,
  currentUserName,
  onClose,
  onSubmit,
  onNicknameChange,
  onAvatarChange,
}: ChatSettingsModalProps) => {
  const { t, language, setLanguage, theme, setTheme } = useAppPreferences();
  const languageItems: AppLanguage[] = ["ru", "en"];

  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="settings-title">
            {t("settingsTitle")}
          </h2>
          <button type="button" className={s.modalClose} onClick={onClose} aria-label={t("settingsClose")}>
            ×
          </button>
        </div>

        <form className={s.nicknameForm} onSubmit={onSubmit}>
          <div className={s.nicknameField}>
            <label className={s.nicknameLabel} htmlFor="nickname">
              {t("settingsNickname")}
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => onNicknameChange(event.target.value)}
              placeholder={currentUserName}
              maxLength={24}
              disabled={!authUser || savingNickname}
              aria-label={t("settingsNickname")}
            />
            {nicknameError && <div className={s.nicknameError}>{nicknameError}</div>}
          </div>

          <fieldset className={p.avatarField}>
            <legend className={s.preferenceLabel}>{t("settingsAvatar")}</legend>
            <div className={p.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={`${p.avatarOption} ${avatarId === avatar.id ? p.avatarOptionActive : ""}`}
                  aria-label={t(avatar.label)}
                  aria-pressed={avatarId === avatar.id}
                  onClick={() => onAvatarChange(avatar.id)}
                >
                  <Avatar avatarId={avatar.id} size="medium" alt="" />
                  <span>{t(avatar.label)}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={s.preferenceField}>
            <span className={s.preferenceLabel}>{t("prefsLanguage")}</span>
            <div className={s.preferenceGroup} role="group" aria-label={t("prefsLanguage")}>
              {languageItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`${s.preferenceButton} ${language === item ? s.preferenceButtonActive : ""}`}
                  onClick={() => setLanguage(item)}
                >
                  {item === "ru" ? t("prefsLanguageRu") : t("prefsLanguageEn")}
                </button>
              ))}
            </div>
          </div>

          <div className={s.preferenceField}>
            <span className={s.preferenceLabel}>{t("prefsTheme")}</span>
            <button
              type="button"
              className={`${s.preferenceButton} ${s.themeToggle}`}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
              {theme === "light" ? t("themeLight") : t("themeDark")}
            </button>
          </div>

          <div className={s.modalActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("commonCancel")}
            </Button>
            <Button type="submit" disabled={!authUser || savingNickname}>
              {savingNickname ? t("settingsSaving") : t("commonSave")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
