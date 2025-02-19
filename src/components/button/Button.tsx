import { ComponentPropsWithoutRef } from "react";
import s from "./button.module.css";
import clsx from "clsx";

type ButtonProps = {} & ComponentPropsWithoutRef<"button">;
export const Button = ({ className, ...props }: ButtonProps) => {
  return <button className={clsx(s.button, className)} {...props}></button>;
};
