"use client";

/**
 * lib/query-client.ts
 *
 * TanStack Query client configuration.
 * Single instance shared across the app via QueryClientProvider.
 */
import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,   // 5 minutes
        gcTime: 1000 * 60 * 10,     // 10 minutes garbage collection
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Browser singleton — prevents re-creating client on re-renders
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
