import { FormEvent } from "react";
import type { Message } from "@/entities/message/model/types";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";

type ChatInputProps = {
  input: string;
  sending: boolean;
  disabled?: boolean;
  replyTarget: Message | null;
  onChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: (event?: FormEvent) => void;
};

export const ChatInput = ({ input, sending, disabled, replyTarget, onChange, onCancelReply, onSubmit }: ChatInputProps) => {
  const locked = sending || disabled;
  const replyAuthor = replyTarget?.userName || replyTarget?.user || "anonymous@node";
  const replyText = replyTarget?.text ?? "";
  const replyPreviewText = replyText.length > 120 ? `${replyText.slice(0, 120)}...` : replyText;

  return (
    <form className={s.inputArea} onSubmit={onSubmit}>
      {replyTarget && (
        <div className={s.replyComposer}>
          <div className={s.replyComposerMeta}>Replying to {replyAuthor}</div>
          <div className={s.replyComposerText}>{replyPreviewText}</div>
          <button type="button" className={s.replyComposerCancel} onClick={onCancelReply} disabled={locked}>
            Cancel
          </button>
        </div>
      )}
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
