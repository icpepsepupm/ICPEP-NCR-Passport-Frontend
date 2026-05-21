"use client";

import Image from "next/image";
import { isBadgeImageUrl, resolveBadgeDisplay } from "@/lib/badges/utils";

const SIZE_CLASS = {
  sm: { box: "h-8 w-8", emoji: "text-xl", image: 32 },
  md: { box: "h-14 w-14", emoji: "text-3xl", image: 56 },
  lg: { box: "h-28 w-28", emoji: "text-5xl", image: 112 },
} as const;

type BadgeDisplayProps = {
  value?: string | null;
  size?: keyof typeof SIZE_CLASS;
  className?: string;
  alt?: string;
};

export function BadgeDisplay({
  value,
  size = "md",
  className = "",
  alt = "Event badge",
}: BadgeDisplayProps) {
  const display = resolveBadgeDisplay(value);
  const s = SIZE_CLASS[size];

  if (isBadgeImageUrl(display)) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl ${s.box} ${className}`}
      >
        <Image
          src={display}
          alt={alt}
          fill
          className="object-contain"
          unoptimized={display.startsWith("data:")}
        />
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center ${s.box} ${s.emoji} ${className}`}
      role="img"
      aria-label={alt}
    >
      {display}
    </span>
  );
}

export default BadgeDisplay;
