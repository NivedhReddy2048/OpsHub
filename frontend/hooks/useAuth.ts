"use client";

/**
 * hooks/useAuth.ts
 *
 * Thin wrapper around AuthContext for convenience.
 * Components import this hook — not AuthContext directly.
 *
 * Usage:
 *   const { user, isAuthenticated, isLoading, login, logout } = useAuth();
 */
export { useAuthContext as useAuth } from "@/context/AuthContext";
