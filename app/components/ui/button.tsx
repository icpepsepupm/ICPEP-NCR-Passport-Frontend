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
      "hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      "transition-colors",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? "Loading…" : children}
      </button>
    );
  }
);
Button.displayName = "Button";

export default Button;
