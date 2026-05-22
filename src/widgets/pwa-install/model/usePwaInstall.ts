import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: BeforeInstallPromptOutcome;
    platform: string;
  }>;
};

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;

  const standaloneNavigator = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true;
};

export const usePwaInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    const syncInstalledState = () => {
      setIsInstalled(isStandaloneMode());
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      syncInstalledState();

      if (isStandaloneMode()) {
        setDeferredPrompt(null);
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalling(false);
      setIsInstalled(true);
    };

    syncInstalledState();
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", syncInstalledState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", syncInstalledState);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt || isInstalling) return false;

    setIsInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        setIsInstalled(true);
        return true;
      }

      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  return useMemo(
    () => ({
      canInstall: !isInstalled && !!deferredPrompt,
      isInstalling,
      isInstalled,
      install,
    }),
    [deferredPrompt, isInstalled, isInstalling],
  );
};
