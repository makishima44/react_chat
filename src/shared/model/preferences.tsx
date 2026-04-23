import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "ru" | "en";
export type AppTheme = "green" | "red" | "purple";

const LANGUAGE_STORAGE_KEY = "react_chat_language";
const THEME_STORAGE_KEY = "react_chat_theme";

type TranslationParams = Record<string, string | number>;

const translations = {
  ru: {
    commonLoading: "Загрузка...",
    commonCancel: "Отмена",
    commonSave: "Сохранить",
    commonDelete: "Удалить",
    commonLogout: "Выход",
    commonRooms: "Комнаты",
    commonAnonymous: "anonymous@node",
    commonUnknownCreator: "Создатель неизвестен",
    commonCreatedBy: "Создал: {name}",
    commonSearch: "Поиск",
    shellReady: "СИСТЕМА ГОТОВА",
    splashBooting: "ЗАПУСК СИСТЕМЫ",
    splashSkip: "Нажмите, чтобы пропустить",
    prefsLanguage: "Язык",
    prefsLanguageRu: "РУ",
    prefsLanguageEn: "EN",
    prefsTheme: "Тема",
    prefsThemeGreen: "Зелёная",
    prefsThemeRed: "Красная",
    prefsThemePurple: "Пурпурная",
    loginTitle: "Точка Доступа",
    loginSubtitle: "Подтвердите личность для входа в защищённый канал.",
    loginNoAccess: "Нет доступа?",
    loginRequestAccess: "Запросить доступ",
    loginEmailLabel: "Email оператора",
    loginPasswordLabel: "Код доступа",
    loginPasswordPlaceholder: "Введите код доступа",
    loginSubmit: "Войти в канал",
    loginSubmitting: "Подключение...",
    registerTitle: "Запрос Доступа",
    registerSubtitle: "Зарегистрируйте ID оператора для входа в сеть.",
    registerHaveAccess: "Уже есть доступ?",
    registerBackToLogin: "Вернуться ко входу",
    registerPasswordPlaceholder: "Придумайте код доступа",
    registerSubmit: "Авторизовать доступ",
    registerSubmitting: "Регистрация...",
    roomsTitle: "Каталог Каналов",
    roomsSubtitle: "Выберите комнату или создайте новый защищённый канал.",
    roomsCreateNameLabel: "Название комнаты",
    roomsCreateNamePlaceholder: "Например: Delta-7",
    roomsCreatePasswordLabel: "Пароль комнаты",
    roomsCreatePasswordPlaceholder: "Минимум 4 символа",
    roomsCreateSubmit: "Создать комнату",
    roomsCreateSubmitting: "Создание...",
    roomsSectionTitle: "Доступные комнаты",
    roomsSectionActive: "{count} активных",
    roomsUnreadCountTitle: "Новых сообщений: {count}",
    roomsEmpty: "Комнат пока нет. Создайте первую.",
    roomsUnnamed: "Безымянный канал",
    roomsDeleteRoomTitle: "Удалить комнату",
    roomsDeleteRoomPrompt: "Вы уверены, что хотите удалить комнату \"{name}\"?",
    roomsDeleteRoomWarning: "Все сообщения этой комнаты будут удалены без возможности восстановления.",
    roomsDeleteSubmitting: "Удаление...",
    roomsAccessTitle: "Доступ к комнате",
    roomsAccessPrompt: "Комната \"{name}\" защищена паролем.",
    roomsAccessPasswordLabel: "Пароль",
    roomsAccessPasswordPlaceholder: "Введите пароль",
    roomsAccessConfirm: "Войти",
    settingsTitle: "Настройки",
    settingsNickname: "Никнейм",
    settingsClose: "Закрыть настройки",
    settingsSaving: "Сохранение...",
    challengeTitle: "Контроль доступа",
    challengePrompt: "Закончите фразу: \"Лишь утратив всё до конца...\"",
    challengePlaceholder: "Введите продолжение",
    challengeInputLabel: "Ответ",
    challengeSubmit: "Подтвердить",
    challengeInvalid: "Неверный ответ. Попробуйте снова.",
    chatRoomsAria: "Открыть комнаты",
    chatOpenSettingsAria: "Открыть настройки",
    chatDeleteCloseAria: "Закрыть подтверждение удаления",
    chatDeleteTitle: "Удаление сообщения",
    chatDeletePrompt: "Вы уверены, что хотите удалить это сообщение?",
    chatDeleteSubmitting: "Удаление...",
    chatReplyingTo: "Ответ для {name}",
    chatReplyCancel: "Отменить",
    chatSearchPlaceholder: "Поиск по сообщениям",
    chatSearchClear: "Сбросить",
    chatSearchResults: "Найдено: {count}",
    chatSearchEmpty: "Совпадений не найдено.",
    chatInputPlaceholder: "Введите сообщение",
    chatInputAria: "Сообщение",
    chatSending: "Отправка...",
    chatSend: "Отправить",
    chatNoMessages: "Сообщений пока нет.",
    chatEditAria: "Редактирование сообщения",
    chatEditSave: "Сохранить",
    chatEdited: "(изменено)",
    chatReply: "Ответить",
    chatEdit: "Изменить",
    chatTyping: "{names} печатает...",
    chatOnline: "{count} онлайн",
    chatParticipants: "Участники",
    chatTimePending: "отправка",
    chatEnableMentionAlerts: "Включить упоминания",
    chatMentionAlertsEnabled: "Упоминания включены",
    chatMentionAlertsBlocked: "Уведомления в браузере заблокированы",
    chatMissingTitle: "Канал недоступен",
    chatMissingSubtitle: "Эта комната больше не существует. Вернитесь в каталог.",
    chatMissingBody: "Запрошенная комната не найдена.",
    chatBackToRooms: "Вернуться к комнатам",
    chatTitle: "Защищённый Канал",
    chatSubtitleWithRoom: "Комната: {name}",
    chatSubtitleFallback: "Канал активен. Используйте шифрованный ввод ниже.",
    roomsSyncError: "Не удалось синхронизировать комнаты. Обновите страницу.",
    logoutError: "Не удалось выйти. Попробуйте снова.",
    firebaseInvalidCredential: "Неверный email или пароль",
    firebaseInvalidEmail: "Введите корректный email",
    firebaseTooManyRequests: "Слишком много попыток. Подождите минуту и попробуйте снова.",
    firebaseNetworkError: "Ошибка сети. Попробуйте снова.",
    loginGenericError: "Не удалось выполнить вход. Попробуйте снова.",
    registerEmailExists: "Пользователь с таким email уже существует",
    registerWeakPassword: "Пароль должен быть не короче 6 символов",
    registerGenericError: "Не удалось зарегистрироваться. Попробуйте снова.",
    roomCreateNameRequired: "Введите название комнаты.",
    roomCreateNameLength: "Название должно быть от 2 до 40 символов.",
    roomCreatePasswordRequired: "Введите пароль комнаты.",
    roomCreatePasswordLength: "Пароль должен быть от 4 до 32 символов.",
    roomCreateDenied: "Нет доступа для создания комнаты.",
    roomCreateFailed: "Не удалось создать комнату. Попробуйте снова.",
    roomDeleteDenied: "Нет доступа для удаления комнаты.",
    roomDeleteFailed: "Не удалось удалить комнату. Попробуйте снова.",
    roomAccessPasswordRequired: "Введите пароль.",
    roomAccessPasswordInvalid: "Неверный пароль.",
    nicknameSaveFailed: "Не удалось обновить никнейм. Попробуйте снова.",
    chatPostDenied: "Доступ запрещён. У вас больше нет прав отправлять сообщения.",
    chatPostFailed: "Не удалось отправить сообщение. Попробуйте снова.",
    chatMessageEmpty: "Сообщение не может быть пустым.",
    chatEditDenied: "Доступ запрещён. Нельзя изменить это сообщение.",
    chatEditFailed: "Не удалось изменить сообщение. Попробуйте снова.",
    chatDeleteDenied: "Доступ запрещён. Нельзя удалить это сообщение.",
    chatDeleteFailed: "Не удалось удалить сообщение. Попробуйте снова.",
    chatIndexMissing: "Для Firestore нужен составной индекс roomId + createdAt.",
    chatReadDenied: "Доступ запрещён. У вас нет прав читать эту комнату.",
    chatSyncFailed: "Не удалось синхронизировать сообщения. Проверьте соединение.",
    mentionNotificationTitle: "Упоминание в {room}",
    mentionNotificationTitleFallback: "Новое упоминание",
    emailRequired: "Email обязателен",
    emailInvalid: "Введите корректный email",
    passwordRequired: "Пароль обязателен",
    passwordTooShort: "Пароль должен содержать минимум 6 символов",
    passwordTooLong: "Пароль должен содержать не более 64 символов",
    nicknameRequired: "Никнейм обязателен",
    nicknameTooShort: "Никнейм должен содержать минимум 2 символа",
    nicknameTooLong: "Никнейм должен содержать не более 24 символов",
  },
  en: {
    commonLoading: "Loading...",
    commonCancel: "Cancel",
    commonSave: "Save",
    commonDelete: "Delete",
    commonLogout: "Logout",
    commonRooms: "Rooms",
    commonAnonymous: "anonymous@node",
    commonUnknownCreator: "Creator unknown",
    commonCreatedBy: "Created by: {name}",
    commonSearch: "Search",
    shellReady: "SYS READY",
    splashBooting: "SYSTEM BOOTING",
    splashSkip: "Click to skip",
    prefsLanguage: "Language",
    prefsLanguageRu: "RU",
    prefsLanguageEn: "EN",
    prefsTheme: "Theme",
    prefsThemeGreen: "Green",
    prefsThemeRed: "Red",
    prefsThemePurple: "Purple",
    loginTitle: "Access Node",
    loginSubtitle: "Identify yourself to enter the secure channel.",
    loginNoAccess: "No clearance yet?",
    loginRequestAccess: "Request access",
    loginEmailLabel: "Operator Email",
    loginPasswordLabel: "Passcode",
    loginPasswordPlaceholder: "Enter passcode",
    loginSubmit: "Enter Channel",
    loginSubmitting: "Connecting...",
    registerTitle: "Request Access",
    registerSubtitle: "Register your operator ID to join the network.",
    registerHaveAccess: "Already cleared?",
    registerBackToLogin: "Return to login",
    registerPasswordPlaceholder: "Choose passcode",
    registerSubmit: "Authorize Access",
    registerSubmitting: "Registering...",
    roomsTitle: "Channel Directory",
    roomsSubtitle: "Select an existing room or spin up a new secure channel.",
    roomsCreateNameLabel: "Room name",
    roomsCreateNamePlaceholder: "Example: Delta-7",
    roomsCreatePasswordLabel: "Room password",
    roomsCreatePasswordPlaceholder: "At least 4 characters",
    roomsCreateSubmit: "Create room",
    roomsCreateSubmitting: "Creating...",
    roomsSectionTitle: "Available rooms",
    roomsSectionActive: "{count} active",
    roomsUnreadCountTitle: "Unread messages: {count}",
    roomsEmpty: "No rooms yet. Create the first one.",
    roomsUnnamed: "Unnamed channel",
    roomsDeleteRoomTitle: "Delete room",
    roomsDeleteRoomPrompt: "Are you sure you want to delete room \"{name}\"?",
    roomsDeleteRoomWarning: "All messages in this room will be permanently deleted.",
    roomsDeleteSubmitting: "Deleting...",
    roomsAccessTitle: "Room access",
    roomsAccessPrompt: "Room \"{name}\" is password protected.",
    roomsAccessPasswordLabel: "Password",
    roomsAccessPasswordPlaceholder: "Enter password",
    roomsAccessConfirm: "Join",
    settingsTitle: "Settings",
    settingsNickname: "Nickname",
    settingsClose: "Close settings",
    settingsSaving: "Saving...",
    challengeTitle: "Access check",
    challengePrompt: "Finish the phrase: \"Only after losing everything...\"",
    challengePlaceholder: "Enter the ending",
    challengeInputLabel: "Answer",
    challengeSubmit: "Confirm",
    challengeInvalid: "Incorrect answer. Please try again.",
    chatRoomsAria: "Open rooms",
    chatOpenSettingsAria: "Open settings",
    chatDeleteCloseAria: "Close delete confirmation",
    chatDeleteTitle: "Delete message",
    chatDeletePrompt: "Are you sure you want to delete this message?",
    chatDeleteSubmitting: "Deleting...",
    chatReplyingTo: "Replying to {name}",
    chatReplyCancel: "Cancel",
    chatSearchPlaceholder: "Search messages",
    chatSearchClear: "Clear",
    chatSearchResults: "Found: {count}",
    chatSearchEmpty: "No matches found.",
    chatInputPlaceholder: "Transmit message",
    chatInputAria: "Message",
    chatSending: "Sending...",
    chatSend: "Transmit",
    chatNoMessages: "No transmissions yet.",
    chatEditAria: "Edit message",
    chatEditSave: "Save",
    chatEdited: "(edited)",
    chatReply: "Reply",
    chatEdit: "Edit",
    chatTyping: "{names} typing...",
    chatOnline: "{count} online",
    chatParticipants: "Participants",
    chatTimePending: "sending",
    chatEnableMentionAlerts: "Enable mention alerts",
    chatMentionAlertsEnabled: "Mention alerts enabled",
    chatMentionAlertsBlocked: "Browser notifications are blocked",
    chatMissingTitle: "Channel Lost",
    chatMissingSubtitle: "This room no longer exists. Return to the directory.",
    chatMissingBody: "The requested room could not be found.",
    chatBackToRooms: "Back to Rooms",
    chatTitle: "Secure Channel",
    chatSubtitleWithRoom: "Room: {name}",
    chatSubtitleFallback: "Live relay active. Use encrypted prompt below.",
    roomsSyncError: "Failed to sync rooms. Please refresh.",
    logoutError: "Logout failed. Please try again.",
    firebaseInvalidCredential: "Invalid email or password",
    firebaseInvalidEmail: "Please enter a valid email address",
    firebaseTooManyRequests: "Too many attempts. Please wait a minute and try again.",
    firebaseNetworkError: "Network error. Please try again.",
    loginGenericError: "Login failed. Please try again.",
    registerEmailExists: "A user with this email already exists",
    registerWeakPassword: "Password must be at least 6 characters long",
    registerGenericError: "Registration failed. Please try again.",
    roomCreateNameRequired: "Enter room name.",
    roomCreateNameLength: "Room name must be 2 to 40 characters.",
    roomCreatePasswordRequired: "Enter room password.",
    roomCreatePasswordLength: "Password must be 4 to 32 characters.",
    roomCreateDenied: "No access to create a room.",
    roomCreateFailed: "Failed to create room. Please try again.",
    roomDeleteDenied: "No access to delete this room.",
    roomDeleteFailed: "Failed to delete room. Please try again.",
    roomAccessPasswordRequired: "Enter password.",
    roomAccessPasswordInvalid: "Incorrect password.",
    nicknameSaveFailed: "Failed to update nickname. Please try again.",
    chatPostDenied: "Access denied. You no longer have permission to post.",
    chatPostFailed: "Transmission failed. Please try again.",
    chatMessageEmpty: "Message cannot be empty.",
    chatEditDenied: "Access denied. You cannot edit this message.",
    chatEditFailed: "Failed to edit message. Please try again.",
    chatDeleteDenied: "Access denied. You cannot delete this message.",
    chatDeleteFailed: "Failed to delete message. Please try again.",
    chatIndexMissing: "Firestore needs a composite index for roomId + createdAt.",
    chatReadDenied: "Access denied. You do not have permission to read this room.",
    chatSyncFailed: "Failed to sync messages. Check your connection.",
    mentionNotificationTitle: "Mention in {room}",
    mentionNotificationTitleFallback: "New mention",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    passwordRequired: "Password is required",
    passwordTooShort: "Password must be at least 6 characters long",
    passwordTooLong: "Password must be 64 characters or fewer",
    nicknameRequired: "Nickname is required",
    nicknameTooShort: "Nickname must be at least 2 characters long",
    nicknameTooLong: "Nickname must be 24 characters or fewer",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];
export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

type AppPreferencesContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  t: TranslateFn;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

const interpolate = (template: string, params?: TranslationParams) => {
  if (!params) return template;
  return Object.entries(params).reduce((result, [key, value]) => result.split(`{${key}}`).join(String(value)), template);
};

const readLanguage = (): AppLanguage => {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "ru" || stored === "en" ? stored : "en";
};

const readTheme = (): AppTheme => {
  if (typeof window === "undefined") return "green";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "green" || stored === "red" || stored === "purple" ? stored : "green";
};

export const AppPreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<AppLanguage>(readLanguage);
  const [theme, setTheme] = useState<AppTheme>(readTheme);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const t: TranslateFn = useMemo(
    () => (key, params) => {
      const template = translations[language][key] ?? translations.en[key];
      return interpolate(template, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t,
    }),
    [language, theme, t],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
};

export const useAppPreferences = () => {
  const context = useContext(AppPreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return context;
};
