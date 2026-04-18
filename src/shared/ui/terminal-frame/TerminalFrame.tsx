import { ReactNode } from "react";
import clsx from "clsx";
import { useAppPreferences } from "@/shared/model/preferences";
import s from "./terminalFrame.module.css";

type TerminalFrameProps = {
  title: string;
  subtitle?: string;
  headerSlot?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

export const TerminalFrame = ({
  title,
  subtitle,
  headerSlot,
  footer,
  className,
  children,
}: TerminalFrameProps) => {
  const { t } = useAppPreferences();

  return (
    <section className={clsx(s.frame, className)}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.statusDot} aria-hidden="true" />
          <span className={s.statusText}>{t("shellReady")}</span>
        </div>

        <div className={s.headerRight}>{headerSlot && <div className={s.headerSlot}>{headerSlot}</div>}</div>
      </div>

      <div className={s.titleBlock}>
        <h1 className={clsx(s.title, "flicker")}>
          {title}
          <span className={s.caret} aria-hidden="true" />
        </h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>

      <div className={s.content}>{children}</div>

      {footer && <div className={s.footer}>{footer}</div>}
    </section>
  );
};
