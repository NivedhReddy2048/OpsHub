"use client";

/**
 * context/AuthContext.tsx
 *
 * Global authentication state for OpsHub.
 * Provides: user, isAuthenticated, isLoading, login, logout, refreshUser.
 *
 * Strategy:
 *  - On mount, if access_token exists in localStorage, fetch /me to hydrate user.
 *  - login() calls the JWT token endpoint, stores tokens, fetches /me.
 *  - logout() blacklists refresh token, clears storage, redirects to /login.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { User, LoginCredentials, AuthTokens } from "@/types";
import { authService } from "@/services/authService";

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch /me and populate user state.
   * Called on mount and after login.
   */
  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      // Token invalid or expired — clear storage silently.
      // The Axios 401 interceptor handles token refresh; if it still fails, tokens are cleared.
      setUser(null);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }, []);

  /**
   * Bootstrap: hydrate auth state from localStorage on first render.
   */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  /**
   * login(): exchange credentials for JWT tokens, then fetch /me.
   * Throws on API error so the login form can display server errors.
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const tokens: AuthTokens = await authService.login(credentials);
      localStorage.setItem("access_token", tokens.access);
      localStorage.setItem("refresh_token", tokens.refresh);
      await refreshUser();
      router.push("/dashboard");
    },
    [refreshUser, router]
  );

  /**
   * logout(): blacklist refresh token, clear storage, redirect to /login.
   * Fails gracefully — always clears local state even if API call fails.
   */
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Logout API failure is non-fatal — still clear local session.
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useAuthContext — consume the AuthContext.
 * Must be used within a component wrapped by <AuthProvider>.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
