import { useEffect, useMemo, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import type { Room, RoomCategory } from "@/entities/room/model/types";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { ChatSettingsModal } from "@/pages/chat/ui/components/ChatSettingsModal";
import { Avatar } from "@/shared/ui/avatar/Avatar";
import { useAppPreferences } from "@/shared/model/preferences";
import { useRoomsQuery } from "../model/useRoomsQuery";
import { useUserSettings } from "../model/useUserSettings";
import { useRoomCreation } from "../model/useRoomCreation";
import { useRoomAccess } from "../model/useRoomAccess";
import { useRoomDeletion } from "../model/useRoomDeletion";
import { useDirectChatsQuery } from "@/pages/direct-messages/model/useDirectChatsQuery";
import { DeleteRoomModal } from "./components/DeleteRoomModal";
import { AccessRoomModal } from "./components/AccessRoomModal";
import { CreateRoomDialog } from "./components/CreateRoomDialog";
import { RoomRow } from "./components/RoomRow";
import { RoomsSidebar } from "./components/RoomsSidebar";
import s from "./roomsPage.module.css";

const categories: RoomCategory[] = [
  "general",
  "tech",
  "creative",
  "music",
  "gaming",
  "off-topic",
];
type RoomFilter = "all" | RoomCategory;
const filters: RoomFilter[] = ["all", ...categories];

const categoryTranslation = (category: RoomFilter) =>
  `roomsCategory_${category.replace("-", "")}` as "roomsCategory_all";

export const RoomsPage = () => {
  const navigate = useNavigate();
  const authUser = auth.currentUser;
  const { t, theme, setTheme } = useAppPreferences();
  const currentUserId = authUser?.uid ?? "anonymous";
  const currentUserName =
    authUser?.displayName?.trim() || authUser?.email || t("commonAnonymous");
  const { rooms, roomsError, setRoomsError } = useRoomsQuery(currentUserId);
  const { directChats } = useDirectChatsQuery(currentUserId);
  const settings = useUserSettings(authUser);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("all");
  const [sort, setSort] = useState<"recent" | "unread">("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const creation = useRoomCreation({
    currentUserId,
    currentUserName,
    navigate,
  });
  const deletion = useRoomDeletion({ currentUserId });
  const access = useRoomAccess({
    navigate,
    currentUserId,
    currentUserName,
    clearDeleteError: () => deletion.setDeleteError(""),
  });
  const visibleRooms = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return rooms
      .filter(
        (room) => filter === "all" || (room.category ?? "general") === filter,
      )
      .filter(
        (room) =>
          !term ||
          `${room.name} ${room.description ?? ""}`
            .toLocaleLowerCase()
            .includes(term),
      )
      .sort((a, b) =>
        sort === "unread"
          ? (b.unreadCount ?? 0) - (a.unreadCount ?? 0)
          : (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
      );
  }, [filter, rooms, search, sort]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch {
      setRoomsError(t("logoutError"));
    }
  };

  return (
    <main className={s.shell}>
      <RoomsSidebar
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        avatarId={settings.avatarId}
        roomCount={rooms.length}
        directChats={directChats}
        theme={theme}
        onThemeChange={setTheme}
        onOpenSettings={settings.openSettings}
        onNavigate={navigate}
        onLogout={handleLogout}
      />
      <section className={s.main}>
        <header className={s.topbar}>
          <span>{t("roomsBreadcrumb")}</span>
          <button
            type="button"
            className={s.mobileProfile}
            onClick={settings.openSettings}
          >
            <Avatar avatarId={settings.avatarId} size="small" />
          </button>
        </header>
        <div className={s.content}>
          <div className={s.welcome}>
            <div>
              <p className={s.eyebrow}>{t("roomsWelcomeEyebrow")}</p>
              <h1>{t("roomsWelcomeTitle")}</h1>
              <p>{t("roomsWelcomeSubtitle")}</p>
            </div>
            <button
              className={s.primaryButton}
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              <span>＋</span>
              {t("roomsCreateSubmit")}
            </button>
          </div>
          <div className={s.toolbar}>
            <label className={s.search}>
              <span>⌕</span>
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("roomsSearchPlaceholder")}
                aria-label={t("roomsSearchPlaceholder")}
              />
              <kbd>⌘ K</kbd>
            </label>
            <label className={s.sortLabel}>
              <span>{t("roomsSortLabel")}</span>
              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as "recent" | "unread")
                }
              >
                <option value="recent">{t("roomsSortRecent")}</option>
                <option value="unread">{t("roomsSortUnread")}</option>
              </select>
            </label>
          </div>
          <div
            className={s.filters}
            role="group"
            aria-label={t("roomsFilterLabel")}
          >
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                className={filter === value ? s.filterActive : s.filterButton}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {t(categoryTranslation(value))}
              </button>
            ))}
          </div>
          {(roomsError || deletion.deleteError) && (
            <div className={s.error}>{roomsError || deletion.deleteError}</div>
          )}
          <div className={s.listHeader}>
            <h2>{t("roomsListTitle")}</h2>
            <span>
              {t("roomsSectionActive", { count: visibleRooms.length })}
            </span>
          </div>
          <div className={s.roomList}>
            {visibleRooms.length === 0 ? (
              <div className={s.empty}>{t("roomsEmpty")}</div>
            ) : (
              visibleRooms.map((room: Room) => (
                <RoomRow
                  key={room.id}
                  room={room}
                  currentUserId={currentUserId}
                  onOpen={() => access.handleOpenRoom(room.id, room)}
                  onDelete={() => deletion.handleOpenDeleteModal(room)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {createOpen && (
        <CreateRoomDialog
          creation={creation}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {deletion.deleteTarget && (
        <DeleteRoomModal
          deleteTarget={deletion.deleteTarget}
          deletingRoomId={deletion.deletingRoomId}
          onClose={deletion.handleCloseDeleteModal}
          onConfirm={deletion.handleConfirmDelete}
        />
      )}
      {settings.settingsOpen && (
        <ChatSettingsModal
          authUser={authUser}
          nickname={settings.nickname}
          avatarId={settings.avatarId}
          nicknameError={settings.nicknameError}
          savingNickname={settings.savingNickname}
          currentUserName={currentUserName}
          onClose={settings.closeSettings}
          onSubmit={settings.handleNicknameSave}
          onNicknameChange={settings.handleNicknameChange}
          onAvatarChange={settings.handleAvatarChange}
        />
      )}
      {access.accessTarget && (
        <AccessRoomModal
          accessTarget={access.accessTarget}
          accessPassword={access.accessPassword}
          accessError={access.accessError}
          onPasswordChange={access.handleAccessPasswordChange}
          onClose={access.handleCloseAccessModal}
          onConfirm={access.handleConfirmAccess}
        />
      )}
    </main>
  );
};
