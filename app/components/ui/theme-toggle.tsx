"use client";

import * as React from "react";
import { LightMode, DarkMode } from "@mui/icons-material";

export default function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
    // Get theme from localStorage or system preference
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  function applyTheme(newTheme: "light" | "dark") {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      root.style.setProperty("--background", "#0a0a0a");
      root.style.setProperty("--foreground", "#ededed");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      root.style.setProperty("--background", "#ffffff");
      root.style.setProperty("--foreground", "#171717");
    }
  }

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-full border border-cyan-400/30 bg-transparent" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="grid h-10 w-10 place-content-center rounded-full border border-cyan-400/30 bg-black/20 text-cyan-100 transition-all duration-300 hover:border-cyan-300/60 hover:bg-cyan-400/10 hover:scale-110 active:scale-95 cursor-pointer"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <LightMode className="h-5 w-5" />
      ) : (
        <DarkMode className="h-5 w-5" />
      )}
    </button>
  );
}
