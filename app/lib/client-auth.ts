"use client";

export type BasicUser = {
  // Structured name fields (preferred)
  firstName: string;
  lastName: string;
  middleName?: string;
  // Backward-compat: some older records may still have a single 'name'
  name?: string;
  email: string;
  memberId: string;
  school?: string;
  role?: "member" | "scanner" | "admin";
};

const KEY = "icpep-user";

function splitNameFallback(full?: string): Pick<BasicUser, "firstName" | "lastName" | "middleName"> {
  const name = (full ?? "").trim();
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], lastName: parts[1] };
  // Assume First ... Middle Last
  const lastName = parts.pop() as string;
  const firstName = parts.shift() as string;
  const middleName = parts.join(" ") || undefined;
  return { firstName, middleName, lastName };
}

export function getCurrentUser(): BasicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as Partial<BasicUser> & { name?: string };
    const hasStructured = typeof u.firstName === "string" || typeof u.lastName === "string";
    const parts = hasStructured
      ? { firstName: u.firstName ?? "", lastName: u.lastName ?? "", middleName: u.middleName }
      : splitNameFallback(u.name);
    return {
      firstName: parts.firstName,
      lastName: parts.lastName,
      middleName: parts.middleName,
      name: u.name,
      email: u.email ?? "",
      memberId: u.memberId ?? "",
      school: u.school,
      role: u.role,
    };
  } catch {
    return null;
  }
}

export function setCurrentUser(user: BasicUser) {
  // Ensure we persist structured fields; include legacy 'name' for compatibility if provided
  const payload: BasicUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    name: user.name,
    email: user.email,
    memberId: user.memberId,
    school: user.school,
    role: user.role,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
}

export function getDisplayName(user: BasicUser): string {
  const f = (user.firstName ?? "").trim();
  const l = (user.lastName ?? "").trim();
  const m = (user.middleName ?? "").trim();
  if (f || l) {
    const mi = m ? ` ${m[0].toUpperCase()}.` : "";
    return `${l}${l && (f || mi) ? ", " : ""}${f}${mi}`.trim() || user.name || "";
  }
  return user.name || "";
}
