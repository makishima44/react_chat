import type { FormEvent } from "react";
import type { RoomCategory } from "@/entities/room/model/types";
import { useRoomCreation } from "../../model/useRoomCreation";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../roomsPage.module.css";

const categories: RoomCategory[] = [
  "general",
  "tech",
  "creative",
  "music",
  "gaming",
  "off-topic",
];

type CreateRoomDialogProps = {
  creation: ReturnType<typeof useRoomCreation>;
  onClose: () => void;
};

export const CreateRoomDialog = ({
  creation,
  onClose,
}: CreateRoomDialogProps) => {
  const { t } = useAppPreferences();
  const handleSubmit = async (event: FormEvent) => {
    if (await creation.handleCreateRoom(event)) onClose();
  };

  return (
    <div
      className={s.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className={s.modal}
        onSubmit={handleSubmit}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
      >
        <div className={s.modalHeading}>
          <div>
            <h2 id="create-room-title">{t("roomsModalTitle")}</h2>
            <p>{t("roomsModalSubtitle")}</p>
          </div>
          <button
            type="button"
            className={s.closeButton}
            onClick={onClose}
            aria-label={t("settingsClose")}
          >
            ×
          </button>
        </div>
        <label className={s.field}>
          {t("roomsCreateNameLabel")}
          <input
            value={creation.newRoomName}
            onChange={(event) =>
              creation.handleRoomNameChange(event.target.value)
            }
            placeholder={t("roomsCreateNamePlaceholder")}
            maxLength={40}
            required
            autoFocus
          />
        </label>
        <label className={s.field}>
          {t("roomsDescriptionLabel")}
          <textarea
            value={creation.newRoomDescription}
            onChange={(event) =>
              creation.handleRoomDescriptionChange(event.target.value)
            }
            placeholder={t("roomsDescriptionPlaceholder")}
            maxLength={140}
            rows={2}
          />
        </label>
        <label className={s.field}>
          {t("roomsCategoryLabel")}
          <select
            value={creation.newRoomCategory}
            onChange={(event) =>
              creation.handleRoomCategoryChange(
                event.target.value as RoomCategory,
              )
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {t(
                  `roomsCategory_${category.replace("-", "")}` as "roomsCategory_general",
                )}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          {t("roomsCreatePasswordLabel")}
          <input
            type="password"
            value={creation.newRoomPassword}
            onChange={(event) =>
              creation.handleRoomPasswordChange(event.target.value)
            }
            placeholder={t("roomsPasswordOptional")}
            maxLength={32}
          />
        </label>
        {creation.createError && (
          <div className={s.error}>{creation.createError}</div>
        )}
        <div className={s.modalActions}>
          <button type="button" className={s.cancelButton} onClick={onClose}>
            {t("commonCancel")}
          </button>
          <button
            type="submit"
            className={s.primaryButton}
            disabled={creation.creating}
          >
            {creation.creating
              ? t("roomsCreateSubmitting")
              : t("roomsCreateSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
};
