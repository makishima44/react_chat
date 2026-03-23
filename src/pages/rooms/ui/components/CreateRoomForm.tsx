import { FormEvent } from "react";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";

import s from "../roomsPage.module.css";

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
  return (
    <form className={s.createForm} onSubmit={onSubmit}>
      <Input
        label="Название комнаты"
        placeholder="Например: Delta-7"
        value={newRoomName}
        onChange={(event) => onRoomNameChange(event.target.value)}
        maxLength={40}
        required
      />
      <Input
        label="Пароль комнаты"
        placeholder="Минимум 4 символа"
        value={newRoomPassword}
        type="password"
        onChange={(event) => onRoomPasswordChange(event.target.value)}
        maxLength={32}
        required
      />
      {createError && <div className={s.formError}>{createError}</div>}
      <Button type="submit" disabled={creating}>
        {creating ? "Создаю..." : "Создать комнату"}
      </Button>
    </form>
  );
};
