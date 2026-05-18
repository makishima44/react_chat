import type { UserProfile } from "@/entities/user/model/types";
import { Button } from "@/shared/ui/button";
import { useAppPreferences } from "@/shared/model/preferences";

import s from "../directMessagesPage.module.css";

type UserSearchPanelProps = {
  searchValue: string;
  searchError: string;
  searchLoading: boolean;
  searchResults: UserProfile[];
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: () => void;
  onStartDirectChat: (profile: UserProfile) => void;
};

export const UserSearchPanel = ({
  searchValue,
  searchError,
  searchLoading,
  searchResults,
  onSearchValueChange,
  onSearchSubmit,
  onStartDirectChat,
}: UserSearchPanelProps) => {
  const { t } = useAppPreferences();

  return (
    <section className={s.searchPanel}>
      <div className={s.panelHeader}>
        <h2 className={s.panelTitle}>{t("directMessagesStartTitle")}</h2>
        <span className={s.panelHint}>{t("directMessagesStartHint")}</span>
      </div>

      <div className={s.searchForm}>
        <input
          type="text"
          className={s.searchInput}
          value={searchValue}
          onChange={(event) => onSearchValueChange(event.target.value)}
          placeholder={t("directMessagesSearchPlaceholder")}
          aria-label={t("directMessagesSearchPlaceholder")}
        />
        <Button type="button" onClick={onSearchSubmit} disabled={searchLoading || searchValue.trim().length < 2}>
          {searchLoading ? t("directMessagesSearching") : t("commonSearch")}
        </Button>
      </div>

      {searchError && <div className={s.formError}>{searchError}</div>}

      <div className={s.searchResults}>
        {searchResults.length === 0 ? (
          <div className={s.emptyState}>{t("directMessagesSearchEmpty")}</div>
        ) : (
          searchResults.map((profile) => (
            <button key={profile.id} type="button" className={s.userCard} onClick={() => onStartDirectChat(profile)}>
              <div className={s.userIdentity}>
                <span className={s.userName}>{profile.displayName}</span>
                <span className={s.userEmail}>{profile.email}</span>
              </div>
              <span className={s.userAction}>{t("directMessagesOpenChat")}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
};
