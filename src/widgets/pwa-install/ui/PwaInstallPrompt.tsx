import { Button } from "@/shared/ui/button";
import { useAppPreferences } from "@/shared/model/preferences";

import { usePwaInstall } from "../model/usePwaInstall";
import s from "./pwaInstallPrompt.module.css";

export const PwaInstallPrompt = () => {
  const { isPromptVisible, install, isInstalling, dismissPrompt } = usePwaInstall();
  const { t } = useAppPreferences();

  if (!isPromptVisible) {
    return null;
  }

  return (
    <aside className={s.prompt} aria-live="polite">
      <div className={s.heading}>
        <div className={s.label}>{t("pwaInstallReady")}</div>
        <button type="button" className={s.close} onClick={dismissPrompt} aria-label={t("pwaInstallDismiss")}>×</button>
      </div>
      <div className={s.hint}>{t("pwaInstallHint")}</div>
      <Button type="button" className={s.button} onClick={() => void install()} disabled={isInstalling}>
        {isInstalling ? `${t("commonInstallApp")}...` : t("commonInstallApp")}
      </Button>
    </aside>
  );
};
