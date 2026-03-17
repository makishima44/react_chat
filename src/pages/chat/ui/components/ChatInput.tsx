import { FormEvent } from "react";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";

type ChatInputProps = {
  input: string;
  sending: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
};

export const ChatInput = ({ input, sending, disabled, onChange, onSubmit }: ChatInputProps) => {
  const locked = sending || disabled;
  return (
    <form className={s.inputArea} onSubmit={onSubmit}>
      <span className={s.inputPrompt}>$</span>
      <input
        type="text"
        value={input}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Transmit message"
        disabled={locked}
        aria-label="Message"
      />
      <Button type="submit" disabled={locked || !input.trim()}>
        {sending ? "Sending..." : "Transmit"}
      </Button>
    </form>
  );
};
