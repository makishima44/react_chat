import { FormEvent, useEffect, useRef, useState } from "react";
import { useAppPreferences } from "@/shared/model/preferences";

export const useChallengeGate = () => {
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const challengeInputRef = useRef<HTMLInputElement | null>(null);
  const { language, t } = useAppPreferences();

  useEffect(() => {
    const needsChallenge = sessionStorage.getItem("challengeRequired") === "1";
    setChallengeOpen(needsChallenge);
    if (needsChallenge) {
      setChallengeAnswer("");
      setChallengeError("");
    }
  }, []);

  useEffect(() => {
    if (challengeOpen) {
      challengeInputRef.current?.focus();
    }
  }, [challengeOpen]);

  const handleChallengeAnswerChange = (value: string) => {
    setChallengeAnswer(value);
    if (challengeError) {
      setChallengeError("");
    }
  };

  const handleChallengeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = challengeAnswer.trim().toLowerCase();
    const expected = language === "ru" ? "мы обретаем свободу" : "we gain freedom";

    if (normalized === expected) {
      sessionStorage.removeItem("challengeRequired");
      setChallengeOpen(false);
      setChallengeError("");
      return;
    }

    setChallengeError(t("challengeInvalid"));
  };

  return {
    challengeOpen,
    challengeAnswer,
    challengeError,
    challengeInputRef,
    handleChallengeAnswerChange,
    handleChallengeSubmit,
  };
};
