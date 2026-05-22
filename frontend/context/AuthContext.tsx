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
    console.log("[AuthContext.refreshUser] Refreshing user details...");
    try {
      const me = await authService.getMe();
      console.log("[AuthContext.refreshUser] Fetch user succeeded:", me);
      setUser(me);
    } catch (err) {
      console.error("[AuthContext.refreshUser] Failed to fetch user profile, clearing local auth storage:", err);
      // Token invalid or expired — clear storage silently.
      // The Axios 401 interceptor handles token refresh; if it still fails, tokens are cleared.
      setUser(null);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    }
  }, []);

  /**
   * Bootstrap: hydrate auth state from localStorage on first render.
   */
  useEffect(() => {
    const token = localStorage.getItem("access");
    console.log("[AuthContext.useEffect] Hydrating token from localStorage 'access':", token ? `${token.substring(0, 10)}...` : "null");
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshUser().finally(() => {
      console.log("[AuthContext.useEffect] Hydration finished.");
      setIsLoading(false);
    });
  }, [refreshUser]);

  /**
   * login(): exchange credentials for JWT tokens, then fetch /me.
   * Throws on API error so the login form can display server errors.
   */
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      console.log("[AuthContext.login] Starting login flow for email:", credentials.email);
      try {
        const tokens: AuthTokens = await authService.login(credentials);
        console.log("[AuthContext.login] Tokens successfully obtained:", {
          access: tokens.access ? `${tokens.access.substring(0, 10)}...` : "null",
          refresh: tokens.refresh ? `${tokens.refresh.substring(0, 10)}...` : "null"
        });

        // 3. Store JWT tokens correctly using keys 'access' and 'refresh'
        localStorage.setItem("access", tokens.access);
        localStorage.setItem("refresh", tokens.refresh);
        console.log("[AuthContext.login] Tokens saved in localStorage.");

        await refreshUser();
        console.log("[AuthContext.login] User profile hydrated. Executing redirect to /dashboard...");
        
        // 5. Fix frontend redirect after successful login
        router.push("/dashboard");
        console.log("[AuthContext.login] Redirect to /dashboard invoked.");
      } catch (err) {
        console.error("[AuthContext.login] Login failed in context provider:", err);
        throw err;
      }
    },
    [refreshUser, router]
  );

  /**
   * logout(): blacklist refresh token, clear storage, redirect to /login.
   * Fails gracefully — always clears local state even if API call fails.
   */
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh");
    console.log("[AuthContext.logout] Logging out. Refresh token:", refreshToken ? `${refreshToken.substring(0, 10)}...` : "null");
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
        console.log("[AuthContext.logout] Logout request sent to backend successfully.");
      }
    } catch (err) {
      console.error("[AuthContext.logout] Logout API call failed (clearing local state anyway):", err);
      // Logout API failure is non-fatal — still clear local session.
    } finally {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      setUser(null);
      console.log("[AuthContext.logout] Local auth storage cleared. Redirecting to /login.");
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
