"use client";

export type BasicUser = {
  name: string;
  email: string;
  memberId: string;
  school?: string;
  role?: "member" | "scanner" | "admin";
};

const KEY = "icpep-user";

export function getCurrentUser(): BasicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BasicUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: BasicUser) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
}
