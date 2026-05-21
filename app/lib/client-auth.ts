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
  token?: string; // ADD THIS LINE
};

// Synchronous read for client components (localStorage only)
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

// Get current user (returns null if no user)
export async function getCurrentUser(): Promise<BasicUser | null> {
  return getStoredUser();
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