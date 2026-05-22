"use client";

/**
 * app/(auth)/login/page.tsx
 *
 * Real login page for OpsHub.
 * - Calls AuthContext.login() on submit
 * - Shows field-level + server-level errors
 * - Redirects to /dashboard on success (handled by AuthContext)
 * - No metadata export — this is a client component
 */
import { useState, FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AxiosError } from "axios";

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Redirect handled inside AuthContext.login()
    } catch (err) {
      const axiosErr = err as AxiosError<{
        message?: string;
        detail?: string;
        non_field_errors?: string[];
      }>;
      const detail =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.non_field_errors?.[0] ||
        "Invalid email or password. Please try again.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isSubmitting || isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand */}
        <div className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
            <span className="text-sm font-bold text-primary-foreground">OH</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in to OpsHub</h1>
          <p className="text-sm text-muted-foreground">
            Enterprise operations platform
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4"
        >
          {/* Server error */}
          {error && (
            <div
              role="alert"
              id="login-error"
              className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-foreground"
              htmlFor="login-email"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none
                         placeholder:text-muted-foreground
                         focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-foreground"
              htmlFor="login-password"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none
                         placeholder:text-muted-foreground
                         focus:ring-2 focus:ring-primary/40 focus:border-primary/40
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground
                       transition-opacity hover:opacity-90 active:opacity-80
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Contact your administrator to create an account.
        </p>
      </div>
    </div>
  );
}
