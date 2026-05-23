import { useCallback, useEffect, useRef, type RefObject } from "react";

const MOBILE_WIDTH_MAX = 720;
const FOCUS_SCROLL_DELAYS = [0, 120, 280];

type MobileComposerVisibilityResult = {
  composerRef: RefObject<HTMLFormElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
};

export const useMobileComposerVisibility = (): MobileComposerVisibilityResult => {
  const composerRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusTimeoutsRef = useRef<number[]>([]);

  const clearScheduledScrolls = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    focusTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    focusTimeoutsRef.current = [];
  }, []);

  const scrollComposerIntoView = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined" || window.innerWidth > MOBILE_WIDTH_MAX) {
      return;
    }

    const composer = composerRef.current;
    const input = inputRef.current;

    if (!composer || !input || document.activeElement !== input) {
      return;
    }

    composer.scrollIntoView({
      behavior,
      block: "end",
      inline: "nearest",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const input = inputRef.current;
    const visualViewport = window.visualViewport;

    if (!input) {
      return;
    }

    const scheduleFocusScroll = () => {
      clearScheduledScrolls();

      focusTimeoutsRef.current = FOCUS_SCROLL_DELAYS.map((delay) =>
        window.setTimeout(() => {
          scrollComposerIntoView(delay === 0 ? "auto" : "smooth");
        }, delay),
      );
    };

    const handleViewportShift = () => {
      scrollComposerIntoView("auto");
    };

    const handleBlur = () => {
      clearScheduledScrolls();
    };

    input.addEventListener("focus", scheduleFocusScroll);
    input.addEventListener("blur", handleBlur);
    visualViewport?.addEventListener("resize", handleViewportShift);
    visualViewport?.addEventListener("scroll", handleViewportShift);

    return () => {
      input.removeEventListener("focus", scheduleFocusScroll);
      input.removeEventListener("blur", handleBlur);
      visualViewport?.removeEventListener("resize", handleViewportShift);
      visualViewport?.removeEventListener("scroll", handleViewportShift);
      clearScheduledScrolls();
    };
  }, [clearScheduledScrolls, scrollComposerIntoView]);

  return {
    composerRef,
    inputRef,
  };
};
