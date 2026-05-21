import { DEFAULT_EVENT_BADGE } from "@/lib/badges/presets";

export function isBadgeImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim();
  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("data:image/")
  );
}

export function resolveBadgeDisplay(value: string | null | undefined): string {
  if (!value?.trim()) return DEFAULT_EVENT_BADGE;
  return value.trim();
}

export const BADGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const BADGE_UPLOAD_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
