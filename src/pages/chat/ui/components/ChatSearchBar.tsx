import { useEffect, useRef } from "react";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "../chatPage.module.css";

type ChatSearchBarProps = {
  searchQuery: string;
  resultCount: number;
  hasActiveSearch: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export const ChatSearchBar = ({ searchQuery, resultCount, hasActiveSearch, onChange, onClear, mobileOpen = true, onMobileClose }: ChatSearchBarProps) => {
  const { t } = useAppPreferences();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileOpen) inputRef.current?.focus();
  }, [mobileOpen]);

  return (
    <div className={s.searchBar} id="room-message-search" data-active={hasActiveSearch} data-mobile-open={mobileOpen}>
      <svg className={s.searchGlyph} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m15.5 15.5 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className={s.searchInput}
        value={searchQuery}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("chatSearchPlaceholder")}
        aria-label={t("chatSearchPlaceholder")}
        onKeyDown={(event) => {
          if (event.key === "Escape") onMobileClose?.();
        }}
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
