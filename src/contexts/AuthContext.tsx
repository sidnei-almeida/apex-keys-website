"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getMe, login as apiLogin, signup as apiSignup } from "@/lib/api/services";
import { ApiError } from "@/lib/api/http";
import { mergeUserPublic } from "@/lib/merge-user-public";
import {
  clearAccessToken,
  getAccessToken,
  getCachedUser,
  setAccessToken,
  setCachedUser,
} from "@/lib/auth/token-storage";
import type { SignupRequest, UserPublic } from "@/types/api";

type AuthContextValue = {
  user: UserPublic | null;
  /** Hidratação inicial (token + /auth/me) concluída */
  isReady: boolean;
  isAuthenticated: boolean;
  /** Para `<UserAvatar urlCacheBust={…} />` após upload (mesma path = cache do browser). */
  avatarUrlCacheBust: number;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Aplica resposta da API (ex.: POST avatar) antes do próximo GET /auth/me. */
  applyUserUpdate: (next: UserPublic) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isValidUserShape(o: unknown): o is UserPublic {
  return (
    !!o &&
    typeof o === "object" &&
    "id" in o &&
    "email" in o &&
    typeof (o as UserPublic).email === "string"
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [avatarUrlCacheBust, setAvatarUrlCacheBust] = useState(0);
  const userRef = useRef<UserPublic | null>(null);
  userRef.current = user;

  const applyUserUpdate = useCallback((next: UserPublic) => {
    const prev = userRef.current;
    if (prev && prev.id !== next.id) return;
    setCachedUser(next);
    setUser(next);
    setAvatarUrlCacheBust((n) => n + 1);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setAvatarUrlCacheBust(0);
      return;
    }
    const rawDisk = getCachedUser();
    const diskUser = isValidUserShape(rawDisk) ? (rawDisk as UserPublic) : null;
    if (diskUser) {
      setUser(diskUser);
    }
    try {
      const me = await getMe(token);
      const next = mergeUserPublic(me, userRef.current, diskUser);
      setCachedUser(next);
      setUser(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        setUser(null);
        setAvatarUrlCacheBust(0);
      }
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshUser().finally(() => setIsReady(true));
    });
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email.trim(), password);
      setAccessToken(res.access_token);
      await refreshUser();
    },
    [refreshUser],
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      await apiSignup(data);
      await login(data.email, data.password);
    },
    [login],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setAvatarUrlCacheBust(0);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      avatarUrlCacheBust,
      login,
      signup,
      logout,
      refreshUser,
      applyUserUpdate,
    }),
    [
      user,
      isReady,
      avatarUrlCacheBust,
      login,
      signup,
      logout,
      refreshUser,
      applyUserUpdate,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
