const KEY = "icpep-user";

export type BasicUser = {
  id?: number;
  username?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email?: string;
  memberId: string;
  school?: string;
  role?: "admin" | "member" | "scanner";
  member?: any;
};

// Get current user (returns null if no user)
export async function getCurrentUser(): Promise<BasicUser | null> {
  if (typeof window === "undefined") return null;

  try {
    // Remove any token usage; rely only on stored user
    const rawUser = localStorage.getItem(KEY);
    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as BasicUser;
    return user;
  } catch {
    return null;
  }
}

// Set user info (in-memory + localStorage)
export function setCurrentUser(user: BasicUser | null) {
  if (user) {
    localStorage.setItem(KEY, JSON.stringify(user));
  } else {
    clearCurrentUser();
  }
}

// Clear user info
export function clearCurrentUser() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("icpep-auth-token"); // just in case any old token
}


function parseStoredUser(raw?: string | null): BasicUser | null {
  if (!raw) return null;
  return JSON.parse(raw) as BasicUser;
}
