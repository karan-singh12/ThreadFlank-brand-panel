"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { authApi } from "./api";
import "./refresh";
import {
  clearSession,
  getRefreshToken,
  getServerSessionSnapshot,
  getSessionSnapshot,
  hasStaleCredentials,
  subscribeSession,
  writeSession,
} from "./storage";
import type { AuthUser, LoginPayload, SignupPayload } from "./types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  /** Creates the account. Resolves true when the user must verify their email before logging in. */
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const status: AuthStatus = session === undefined ? "loading" : session ? "authenticated" : "unauthenticated";
  const token = session?.token ?? null;

  // Drop expired/corrupt credentials, and confirm a live token with the server.
  useEffect(() => {
    if (hasStaleCredentials()) clearSession();
    if (!token) return;

    const controller = new AbortController();
    authApi.verifySession(token, controller.signal).catch((error) => {
      // Only a definitive rejection ends the session; network hiccups keep it.
      if (error instanceof ApiError && error.status === 401) clearSession();
    });
    return () => controller.abort();
  }, [token]);

  const login = useCallback(async (payload: LoginPayload) => {
    const next = await authApi.login(payload);
    writeSession(next);
    return next.user;
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    const result = await authApi.signup(payload);
    if ("token" in result) {
      writeSession(result);
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    clearSession();
    if (refreshToken) authApi.logout(refreshToken).catch(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, token, login, signup, logout }),
    [status, session, token, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
