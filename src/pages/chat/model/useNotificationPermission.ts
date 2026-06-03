import { useEffect, useState } from "react";
import type { NotificationPermissionState } from "./types";

export const useNotificationPermission = () => {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>("unsupported");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    setNotificationPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  return {
    notificationPermission,
    requestNotificationPermission,
  };
};
