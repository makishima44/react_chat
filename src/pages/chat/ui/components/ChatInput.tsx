import { FormEvent, type Ref } from "react";
import type { Message } from "@/entities/message/model/types";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type ChatInputProps = {
  input: string;
  sending: boolean;
  disabled?: boolean;
  replyTarget: Message | null;
  composerRef?: Ref<HTMLFormElement>;
  inputRef?: Ref<HTMLInputElement>;
  onChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: (event?: FormEvent) => void;
};

export const ChatInput = ({ input, sending, disabled, replyTarget, composerRef, inputRef, onChange, onCancelReply, onSubmit }: ChatInputProps) => {
  const locked = sending || disabled;
  const { t } = useAppPreferences();
  const replyAuthor = replyTarget?.userName || replyTarget?.user || t("commonAnonymous");
  const replyText = replyTarget?.text ?? "";
  const replyPreviewText = replyText.length > 120 ? `${replyText.slice(0, 120)}...` : replyText;

  return (
    <form ref={composerRef} className={s.inputArea} onSubmit={onSubmit}>
      {replyTarget && (
        <div className={s.replyComposer}>
          <div className={s.replyComposerMeta}>{t("chatReplyingTo", { name: replyAuthor })}</div>
          <div className={s.replyComposerText}>{replyPreviewText}</div>
          <button type="button" className={s.replyComposerCancel} onClick={onCancelReply} disabled={locked}>
            {t("chatReplyCancel")}
          </button>
        </div>
      )}
      <span className={s.inputPrompt}>$</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("chatInputPlaceholder")}
        disabled={locked}
        aria-label={t("chatInputAria")}
      />
      <Button type="submit" disabled={locked || !input.trim()}>
        {sending ? t("chatSending") : t("chatSend")}
      </Button>
    </form>
  );
};
