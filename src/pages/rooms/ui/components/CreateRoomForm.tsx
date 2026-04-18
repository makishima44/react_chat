import { FormEvent } from "react";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import s from "../roomsPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type CreateRoomFormProps = {
  newRoomName: string;
  newRoomPassword: string;
  createError: string;
  creating: boolean;
  onRoomNameChange: (value: string) => void;
  onRoomPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export const CreateRoomForm = ({
  newRoomName,
  newRoomPassword,
  createError,
  creating,
  onRoomNameChange,
  onRoomPasswordChange,
  onSubmit,
}: CreateRoomFormProps) => {
  const { t } = useAppPreferences();

  return (
    <form className={s.createForm} onSubmit={onSubmit}>
      <Input
        label={t("roomsCreateNameLabel")}
        placeholder={t("roomsCreateNamePlaceholder")}
        value={newRoomName}
        onChange={(event) => onRoomNameChange(event.target.value)}
        maxLength={40}
        required
      />
      <Input
        label={t("roomsCreatePasswordLabel")}
        placeholder={t("roomsCreatePasswordPlaceholder")}
        value={newRoomPassword}
        type="password"
        onChange={(event) => onRoomPasswordChange(event.target.value)}
        maxLength={32}
        required
      />
      {createError && <div className={s.formError}>{createError}</div>}
      <Button type="submit" disabled={creating}>
        {creating ? t("roomsCreateSubmitting") : t("roomsCreateSubmit")}
      </Button>
    </form>
  );
};
