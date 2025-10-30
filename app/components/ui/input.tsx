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
          <label htmlFor={inputId} className="mb-1 block text-sm text-cyan-200/80">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          className={cx(
            "w-full h-10 rounded-md border bg-transparent px-3 text-cyan-100 outline-none",
            "placeholder:text-cyan-200/40",
            "border-cyan-400/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30",
            "transition-all duration-200",
            className
          )}
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
