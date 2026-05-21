"use client";

import * as React from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function parseIsoDate(value: string): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDisabledDay(day: Date, min?: string, max?: string): boolean {
  const iso = toIsoDate(day);
  if (min && iso < min) return true;
  if (max && iso > max) return true;
  return false;
}

function buildCalendarDays(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const pad = first.getDay();
  const days: Array<Date | null> = [];

  for (let i = 0; i < pad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

export type DatePickerProps = {
  value?: string;
  name?: string;
  id?: string;
  label?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  max?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
};

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value = "",
      name,
      id,
      label,
      error,
      placeholder = "Select date",
      required,
      disabled,
      min,
      max,
      className,
      onChange,
      onBlur,
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id ?? autoId;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [open, setOpen] = React.useState(false);

    const selected = parseIsoDate(value);
    const todayIso = toIsoDate(new Date());
    const initialView = selected ?? new Date();
    const [viewYear, setViewYear] = React.useState(initialView.getFullYear());
    const [viewMonth, setViewMonth] = React.useState(initialView.getMonth());

    React.useEffect(() => {
      if (selected) {
        setViewYear(selected.getFullYear());
        setViewMonth(selected.getMonth());
      }
    }, [value]);

    React.useEffect(() => {
      if (!open) return;
      const onDocClick = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setOpen(false);
          onBlur?.();
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
          onBlur?.();
        }
      };
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("keydown", onKey);
      };
    }, [open, onBlur]);

    const emitChange = (next: string) => {
      if (name && onChange) {
        onChange({
          target: { name, value: next },
          currentTarget: { name, value: next },
        } as React.ChangeEvent<HTMLInputElement>);
      } else if (onChange) {
        onChange({
          target: { value: next },
          currentTarget: { value: next },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const selectDay = (day: Date) => {
      if (isDisabledDay(day, min, max)) return;
      emitChange(toIsoDate(day));
      setOpen(false);
      onBlur?.();
    };

    const clear = (e: React.MouseEvent) => {
      e.stopPropagation();
      emitChange("");
    };

    const goToday = () => {
      const today = new Date();
      if (!isDisabledDay(today, min, max)) {
        selectDay(today);
      }
    };

    const days = buildCalendarDays(viewYear, viewMonth);

    return (
      <div ref={containerRef} className={cx("relative w-full", className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="mb-1 block text-[11px] font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
            {required ? <span className="text-rose-400"> *</span> : null}
          </label>
        ) : null}

        <input
          ref={ref}
          type="hidden"
          id={inputId}
          name={name}
          value={value}
          required={required}
          min={min}
          max={max}
          readOnly
          tabIndex={-1}
          aria-hidden
        />

        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={value ? `Selected date: ${formatDisplayDate(value)}` : placeholder}
            className={cx(
              "flex h-10 w-full items-center gap-2 rounded-md border pr-8 text-sm outline-none transition-all duration-300",
              "focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40",
              disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              open ? "border-cyan-300 ring-2 ring-cyan-400/40" : "border-cyan-400/30",
              error && "border-rose-400/50"
            )}
            style={{
              backgroundColor: "var(--input-bg)",
              color: "var(--input-text)",
            }}
          >
            <Calendar className="h-4 w-4 shrink-0 text-cyan-400/80" />
            <span className={cx("flex-1 truncate text-left", !value && "opacity-60")}>
              {value ? formatDisplayDate(value) : placeholder}
            </span>
          </button>
          {value && !required && !disabled ? (
            <button
              type="button"
              onClick={clear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-cyan-400/10 cursor-pointer"
              aria-label="Clear date"
            >
              <X className="h-3.5 w-3.5 text-cyan-400/60" />
            </button>
          ) : null}
        </div>

        {open && !disabled ? (
          <div
            role="dialog"
            aria-label="Choose date"
            className="absolute left-0 top-[calc(100%+6px)] z-[60] w-[min(100%,280px)] rounded-xl border border-cyan-400/25 p-3 shadow-xl backdrop-blur-sm neon-panel"
            style={{ background: "var(--card-bg)" }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }}
                className="rounded-md p-1.5 hover:bg-cyan-400/10 cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4 text-cyan-400" />
              </button>
              <div className="orbitron text-xs font-semibold text-cyan-400">
                {MONTHS[viewMonth]} {viewYear}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }}
                className="rounded-md p-1.5 hover:bg-cyan-400/10 cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4 text-cyan-400" />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-1 text-center text-[10px] font-medium uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }
                const iso = toIsoDate(day);
                const isSelected = value === iso;
                const isToday = todayIso === iso;
                const disabledDay = isDisabledDay(day, min, max);

                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => selectDay(day)}
                    className={cx(
                      "aspect-square rounded-md text-xs transition-all",
                      disabledDay
                        ? "cursor-not-allowed opacity-30"
                        : "cursor-pointer hover:bg-cyan-400/15",
                      isSelected && "bg-cyan-400 font-semibold text-black",
                      !isSelected && isToday && "ring-1 ring-cyan-400/50 text-cyan-300"
                    )}
                    style={
                      !isSelected && !disabledDay
                        ? { color: "var(--text-primary)" }
                        : undefined
                    }
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2 border-t border-cyan-400/15 pt-3">
              <button
                type="button"
                onClick={goToday}
                disabled={isDisabledDay(new Date(), min, max)}
                className="flex-1 rounded-md border border-cyan-400/30 py-1.5 text-[11px] hover:border-cyan-300/60 disabled:opacity-40 cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                Today
              </button>
              {!required ? (
                <button
                  type="button"
                  onClick={() => {
                    emitChange("");
                    setOpen(false);
                    onBlur?.();
                  }}
                  className="flex-1 rounded-md border border-cyan-400/30 py-1.5 text-[11px] hover:border-cyan-300/60 cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-1 text-sm text-rose-300 animate-fade-in" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";

export default DatePicker;
