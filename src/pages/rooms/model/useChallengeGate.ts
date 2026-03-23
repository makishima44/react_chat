import { FormEvent, useEffect, useRef, useState } from "react";

export const useChallengeGate = () => {
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [challengeError, setChallengeError] = useState("");
  const challengeInputRef = useRef<HTMLInputElement | null>(null);

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
    if (normalized === "мы обретаем свободу") {
      sessionStorage.removeItem("challengeRequired");
      setChallengeOpen(false);
      setChallengeError("");
      return;
    }
    setChallengeError("Неверно. Ты еблан!");
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
