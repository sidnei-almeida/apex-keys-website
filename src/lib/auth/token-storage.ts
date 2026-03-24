export const ACCESS_TOKEN_STORAGE_KEY = "@apex:token";
export const LAST_EMAIL_STORAGE_KEY = "@apex:last-email";
export const CACHED_USER_STORAGE_KEY = "@apex:cached-user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  clearCachedUser();
}

export function getLastEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_EMAIL_STORAGE_KEY);
}

export function setLastEmail(email: string): void {
  if (typeof window === "undefined") return;
  const t = email.trim();
  if (t) localStorage.setItem(LAST_EMAIL_STORAGE_KEY, t);
}

export function getCachedUser(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHED_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: object): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHED_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // quota exceeded, ignore
  }
}

export function clearCachedUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHED_USER_STORAGE_KEY);
}
