import type { FirebaseError } from "firebase/app";
import type { TranslateFn } from "@/shared/model/preferences";

const hasFirebaseCode = (error: unknown, code: string) => (error as FirebaseError).code === code;

export const getPermissionError = (error: unknown, deniedMessage: string, fallbackMessage: string) =>
  hasFirebaseCode(error, "permission-denied") ? deniedMessage : fallbackMessage;

export const getMessagesSyncError = (error: unknown, t: TranslateFn) => {
  if (hasFirebaseCode(error, "failed-precondition")) {
    return t("chatIndexMissing");
  }

  if (hasFirebaseCode(error, "permission-denied")) {
    return t("chatReadDenied");
  }

  return t("chatSyncFailed");
};
