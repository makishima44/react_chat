import { ComponentPropsWithoutRef } from "react";
import s from "./button.module.css";
import clsx from "clsx";

type ButtonProps = {
  variant?: "primary" | "ghost";
} & ComponentPropsWithoutRef<"button">;

export const Button = ({
  className,
  variant = "primary",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(s.button, s[`button_${variant}`], className)}
      {...props}
    />
  );
};
