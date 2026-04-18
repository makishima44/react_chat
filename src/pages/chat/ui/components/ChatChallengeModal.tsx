import { FormEvent, RefObject } from "react";
import { Button } from "@/shared/ui/button";
import s from "../chatPage.module.css";
import { useAppPreferences } from "@/shared/model/preferences";

type ChatChallengeModalProps = {
  challengeAnswer: string;
  challengeError: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onAnswerChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export const ChatChallengeModal = ({
  challengeAnswer,
  challengeError,
  inputRef,
  onAnswerChange,
  onSubmit,
}: ChatChallengeModalProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.modalOverlay}>
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="challenge-title">
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle} id="challenge-title">
            {t("challengeTitle")}
          </h2>
        </div>

        <form className={s.challengeForm} onSubmit={onSubmit}>
          <p className={s.challengePrompt}>{t("challengePrompt")}</p>
          <input
            ref={inputRef}
            type="text"
            value={challengeAnswer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder={t("challengePlaceholder")}
            autoComplete="off"
            aria-label={t("challengeInputLabel")}
          />
          {challengeError && <div className={s.challengeError}>{challengeError}</div>}
          <div className={s.modalActions}>
            <Button type="submit" disabled={!challengeAnswer.trim()}>
              {t("challengeSubmit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
