import type { TranslateFn } from "@/shared/model/preferences";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fallbackT: TranslateFn = (key) => {
  const fallbackMap = {
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 6 characters long",
    passwordTooLong: "Password must be 64 characters or fewer",
    nicknameRequired: "Nickname is required",
    nicknameTooShort: "Nickname must be at least 2 characters long",
    nicknameTooLong: "Nickname must be 24 characters or fewer",
  } as const;

  return fallbackMap[key as keyof typeof fallbackMap] ?? "";
};

const withTranslator = (translator?: TranslateFn) => translator ?? fallbackT;

export const getEmailError = (email: string, translator?: TranslateFn) => {
  const t = withTranslator(translator);
  if (!email.trim()) {
    return t("emailRequired");
  }
  if (!emailRegex.test(email)) {
    return t("emailInvalid");
  }
  return "";
};

export const getPasswordError = (password: string, translator?: TranslateFn) => {
  const t = withTranslator(translator);
  if (!password) {
    return t("passwordRequired");
  }
  if (password.length < 6) {
    return t("passwordTooShort");
  }
  if (password.length > 64) {
    return t("passwordTooLong");
  }
  return "";
};

export const getNicknameError = (nickname: string, translator?: TranslateFn) => {
  const t = withTranslator(translator);
  const trimmed = nickname.trim();
  if (!trimmed) {
    return t("nicknameRequired");
  }
  if (trimmed.length < 2) {
    return t("nicknameTooShort");
  }
  if (trimmed.length > 24) {
    return t("nicknameTooLong");
  }
  return "";
};
