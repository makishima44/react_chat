import clsx from "clsx";
import { ComponentPropsWithoutRef, forwardRef } from "react";

import s from "./input.module.css";

type InputProps = {
  id?: string;
  label?: string;
  error?: string;
} & ComponentPropsWithoutRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputClassName = clsx(s.input, error && s.input_error);
    const labelClassName = clsx(s.label, error && s.label_error);

    return (
      <div className={s.container}>
        {label && (
          <label htmlFor={id} className={labelClassName}>
            {label}
          </label>
        )}
        <input id={id} ref={ref} className={inputClassName} {...props} />
        {error && <span className={s.error_message}>{error}</span>}
      </div>
    );
  }
);
