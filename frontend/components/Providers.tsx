"use client";

/**
 * Providers.tsx
 *
 * Wraps the app with:
 *  1. QueryClientProvider  — TanStack Query
 *  2. ThemeProvider        — next-themes dark/light mode
 *  3. AuthProvider         — global auth state (Phase 2)
 *
 * Kept as a client component so root layout stays a Server Component.
 */
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/context/AuthContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
