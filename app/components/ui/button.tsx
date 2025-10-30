"use client";

import * as React from "react";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, loading, children, disabled, ...props }, ref) => {
    const classes = [
      "h-10 w-full rounded-md px-4",
      "orbitron font-semibold tracking-wide",
      "bg-cyan-400 text-black",
      "hover:bg-cyan-300 hover:scale-[1.02] active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100",
      "transition-all duration-200",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            Loading…
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
