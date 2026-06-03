export type NotificationPermissionState = NotificationPermission | "unsupported";

export type OnlineUser = {
  id: string;
  userId?: string;
  userName?: string;
  isTyping?: boolean;
};

export type ChatRoomStatus = "loading" | "ready" | "missing";
