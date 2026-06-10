import { useAppPreferences } from "@/shared/model/preferences";

import s from "../directChatPage.module.css";

type DirectChatSearchBarProps = {
  searchQuery: string;
  resultCount: number;
  hasActiveSearch: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
};

export const DirectChatSearchBar = ({
  searchQuery,
  resultCount,
  hasActiveSearch,
  onChange,
  onClear,
}: DirectChatSearchBarProps) => {
  const { t } = useAppPreferences();

  return (
    <div className={s.searchBar}>
      <span className={s.searchLabel}>{t("commonSearch")}</span>
      <input
        type="text"
        className={s.searchInput}
        value={searchQuery}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("chatSearchPlaceholder")}
        aria-label={t("chatSearchPlaceholder")}
      />
      <div className={s.searchMeta}>
        <span className={s.searchCount} aria-live="polite">
          {hasActiveSearch ? t("chatSearchResults", { count: resultCount }) : "\u00A0"}
        </span>
        <button type="button" className={s.searchClearButton} onClick={onClear} disabled={!searchQuery} aria-hidden={!searchQuery}>
          {t("chatSearchClear")}
        </button>
      </div>
    </div>
  );
};
