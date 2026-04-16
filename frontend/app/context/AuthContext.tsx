"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// --- 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPES) ---
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

// --- 2. LOGIC CACHING (NẰM NGOÀI COMPONENT) ---
let cachedUser: AuthUser | null = null;
let lastRawValue: string | null = null;

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const rawUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

  // So sánh chuỗi thô để tránh parse JSON vô tận
  if (rawUser !== lastRawValue) {
    lastRawValue = rawUser;
    if (!rawUser) {
      cachedUser = null;
    } else {
      try {
        cachedUser = JSON.parse(rawUser) as AuthUser;
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        cachedUser = null;
        lastRawValue = null;
      }
    }
  }
  return cachedUser;
}

// --- 3. KHỞI TẠO CONTEXT ---
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function subscribeToAuthStore(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

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

// --- 4. COMPONENT CHÍNH ---
export function AuthProvider({ children }: { children: ReactNode }) {
  // Lấy dữ liệu user ổn định (không tạo object mới nếu không đổi)
  const user = useSyncExternalStore(subscribeToAuthStore, readStoredUser, () => null);
  
  // Trạng thái Ready (Next.js Client-side)
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

// --- 5. HOOK SỬ DỤNG ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}