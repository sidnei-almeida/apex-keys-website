"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMe, login as apiLogin, signup as apiSignup } from "@/lib/api/services";
import { ApiError } from "@/lib/api/http";
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
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const cached = getCachedUser();
    if (isValidUserShape(cached)) {
      setUser(cached as UserPublic);
    }
    try {
      const me = await getMe(token);
      setCachedUser(me);
      setUser(me);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAccessToken();
        setUser(null);
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
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [user, isReady, login, signup, logout, refreshUser],
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
