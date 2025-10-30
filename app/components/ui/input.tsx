"use client";

import * as React from "react";
// tiny helper to merge classes without adding a dependency
function cx(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        {label ? (
          <label htmlFor={inputId} className="mb-1 block text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cx(
            "w-full h-10 rounded-md border outline-none px-3 transition-all duration-300",
            className
          )}
          style={{
            backgroundColor: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          {...props}
        />
        {error ? (
          <p className="mt-1 text-sm text-rose-300 animate-fade-in" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
