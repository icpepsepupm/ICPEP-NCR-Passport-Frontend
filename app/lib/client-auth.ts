const KEY = "icpep-user";

export type BasicUser = {
  id?: string | number;
  username?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  memberId: string;
  school?: string;
  role?: "admin" | "member" | "scanner";
  member?: any;
  token?: string;
};

export function getStoredUser(): BasicUser | null {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = localStorage.getItem(KEY);
    if (!rawUser) return null;
    return JSON.parse(rawUser) as BasicUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<BasicUser | null> {
  return getStoredUser();
}

export function setCurrentUser(user: BasicUser | null) {
  if (user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  } else {
    clearCurrentUser();
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("icpep-auth-token");
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const rawUser = localStorage.getItem(KEY);
  if (!rawUser) return null;
  const user = JSON.parse(rawUser) as BasicUser;
  return user.token || null;
}

export function getDisplayName(user: BasicUser | null): string {
  if (!user) return "Guest";

  const { firstName, lastName, middleName } = user;

  if (middleName) {
    return `${firstName} ${middleName} ${lastName}`;
  }

  return `${firstName} ${lastName}`;
}

/** Clear local session and sign out from Supabase + API. */
export async function signOutAndClear(): Promise<void> {
  try {
    const { apiClient } = await import("@/lib/api/client");
    await apiClient.post("/auth/signout", {});
  } catch {
    // API signout may fail if session already expired
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.signOut();
  } catch {
    // ignore browser signout errors
  }

  clearCurrentUser();
}
