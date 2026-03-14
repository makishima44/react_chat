import clsx from "clsx";
import { ComponentPropsWithoutRef, forwardRef, useId } from "react";

import s from "./input.module.css";

type InputProps = {
  id?: string;
  label?: string;
  error?: string;
} & ComponentPropsWithoutRef<"input">;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = error ? `${inputId}-error` : undefined;
    const inputClassName = clsx(s.input, error && s.input_error);
    const labelClassName = clsx(s.label, error && s.label_error);

    return (
      <div className={s.container}>
        {label && (
          <label htmlFor={inputId} className={labelClassName}>
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={inputClassName}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          {...props}
        />
        {error && (
          <span id={errorId} className={s.error_message}>
            {error}
          </span>
        )}
      </div>
    );
  }
);
