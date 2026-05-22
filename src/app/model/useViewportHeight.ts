import { useEffect } from "react";

const MOBILE_WIDTH_MAX = 720;
const KEYBOARD_OPEN_THRESHOLD = 120;

const syncViewportHeight = () => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const visualViewport = window.visualViewport;
  const viewportHeight = Math.round(visualViewport?.height ?? window.innerHeight);
  const keyboardInset = Math.max(0, window.innerHeight - viewportHeight);
  const isKeyboardOpen = window.innerWidth <= MOBILE_WIDTH_MAX && keyboardInset > KEYBOARD_OPEN_THRESHOLD;

  root.style.setProperty("--app-height", `${viewportHeight}px`);
  root.dataset.keyboardOpen = isKeyboardOpen ? "true" : "false";
};

export const useViewportHeight = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const visualViewport = window.visualViewport;

    syncViewportHeight();

    visualViewport?.addEventListener("resize", syncViewportHeight);
    visualViewport?.addEventListener("scroll", syncViewportHeight);
    window.addEventListener("resize", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);

    return () => {
      visualViewport?.removeEventListener("resize", syncViewportHeight);
      visualViewport?.removeEventListener("scroll", syncViewportHeight);
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
    };
  }, []);
};
