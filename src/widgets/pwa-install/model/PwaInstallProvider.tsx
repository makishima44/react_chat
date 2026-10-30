import { useEffect, useState, type ReactNode } from "react";
import { PwaInstallContext } from "./PwaInstallContext";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "after_hours_install_prompt_dismissed";

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const standaloneNavigator = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true;
};

export const PwaInstallProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() =>
    typeof window !== "undefined" && window.localStorage.getItem(DISMISSED_KEY) === "true",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const syncInstalledState = () => setIsInstalled(isStandaloneMode());
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

  const dismissPrompt = () => {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISSED_KEY, "true");
  };

  const showPrompt = () => {
    setIsDismissed(false);
    window.localStorage.removeItem(DISMISSED_KEY);
  };

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

  const canInstall = !isInstalled && !!deferredPrompt;

  return (
    <PwaInstallContext.Provider value={{ canInstall, isInstalling, isInstalled, isPromptVisible: canInstall && !isDismissed, install, dismissPrompt, showPrompt }}>
      {children}
    </PwaInstallContext.Provider>
  );
};
