"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export interface AuthUser {
  customer_id: string;
  name: string;
  email: string;
  membership_type?: string;
  total_orders?: number;
  total_spent?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (nextUser: AuthUser) => void;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = "khoi-store-auth-user";
const AUTH_EVENT_NAME = "khoi-store-auth-changed";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function subscribeToAuthStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(AUTH_EVENT_NAME, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(AUTH_EVENT_NAME, handleChange);
  };
}

function emitAuthChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(subscribeToAuthStore, readStoredUser, () => null);
  const isReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const signIn = (nextUser: AuthUser) => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    emitAuthChange();
  };

  const signOut = () => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    emitAuthChange();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isReady,
      signIn,
      signOut,
    }),
    [isReady, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }

  return context;
}
