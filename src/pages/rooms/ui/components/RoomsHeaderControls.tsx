import { Button } from "@/shared/ui/button";
import { useAppPreferences } from "@/shared/model/preferences";

import s from "../roomsPage.module.css";

type RoomsHeaderControlsProps = {
  currentUserName: string;
  onOpenSettings: () => void;
  onLogout: () => void;
  onGoToDirectMessages: () => void;
};

export const RoomsHeaderControls = ({ currentUserName, onOpenSettings, onLogout, onGoToDirectMessages }: RoomsHeaderControlsProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.headerControls}>
      <Button type="button" variant="ghost" className={s.iconButton} onClick={onOpenSettings} aria-label={t("chatOpenSettingsAria")}>
        <svg className={s.icon} viewBox="0 0 24 24" role="img" aria-hidden="true">
          <path
            d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM4.93 12.5c-.02-.16-.03-.33-.03-.5 0-.17.01-.34.03-.5l2.05-.32a5.96 5.96 0 0 1 .83-1.99l-1.22-1.67c.2-.25.42-.47.66-.69l1.67 1.22c.62-.38 1.29-.66 1.99-.83l.32-2.05c.16-.02.33-.03.5-.03.17 0 .34.01.5.03l.32 2.05c.7.17 1.37.45 1.99.83l1.67-1.22c.24.22.46.44.66.69l-1.22 1.67c.38.62.66 1.29.83 1.99l2.05.32c.02.16.03.33.03.5 0 .17-.01.34-.03.5l-2.05.32a5.96 5.96 0 0 1-.83 1.99l1.22 1.67c-.2.25-.42.47-.66.69l-1.67-1.22a5.96 5.96 0 0 1-1.99.83l-.32 2.05c-.16-.02-.33-.03-.5-.03-.17 0-.34.01-.5.03l-.32-2.05a5.96 5.96 0 0 1-1.99-.83l-1.67 1.22c-.24-.22-.46-.44-.66-.69l1.22-1.67a5.96 5.96 0 0 1-.83-1.99l-2.05-.32Z"
            fill="currentColor"
          />
        </svg>
      </Button>
      <Button type="button" variant="ghost" onClick={onGoToDirectMessages}>
        {t("directMessagesNav")}
      </Button>
      <span className={s.operatorName}>{currentUserName}</span>
      <Button variant="ghost" onClick={onLogout}>
        {t("commonLogout")}
      </Button>
    </div>
  );
};
