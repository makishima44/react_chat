import { useEffect, useRef } from "react";
import clsx from "clsx";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "./matrixSplash.module.css";

type MatrixSplashProps = {
  state: "visible" | "fading";
  onSkip: () => void;
};

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const MatrixSplash = ({ state, onSkip }: MatrixSplashProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { t } = useAppPreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrame = 0;
    let columns = 0;
    let drops: number[] = [];
    const fontSize = 16;

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.floor(width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * height);
    };

    const drawFrame = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.fillStyle = "rgba(1, 6, 3, 0.25)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Share Tech Mono", "Courier New", monospace`;
      ctx.fillStyle = "rgba(120, 255, 180, 0.9)";

      for (let i = 0; i < columns; i += 1) {
        const char = CHARSET[Math.floor(Math.random() * CHARSET.length)];
        const x = i * fontSize;
        const y = drops[i];
        ctx.fillText(char, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] += fontSize * 0.6;
        }
      }
    };

    resize();
    if (reduceMotion) {
      drawFrame();
      return () => undefined;
    }

    const tick = () => {
      drawFrame();
      animationFrame = window.requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className={clsx(s.splash, state === "fading" && s.fading)} onClick={onSkip} role="presentation">
      <canvas ref={canvasRef} className={s.canvas} />
      <div className={s.content}>
        <p className={clsx(s.kicker, "flicker")}>{t("splashBooting")}</p>
        <p className={s.subtitle}>{t("splashSkip")}</p>
      </div>
    </div>
  );
};
