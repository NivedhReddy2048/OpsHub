/**
 * middleware.ts
 *
 * Next.js middleware — Phase 1 placeholder.
 * Phase 2: enforce authentication on protected routes,
 * redirect unauthenticated users to /login.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_PREFIXES = ["/dashboard", "/tickets", "/tasks", "/projects", "/team", "/analytics", "/settings", "/audit-log", "/notifications"];

// Routes always accessible without auth
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phase 1: pass all requests through
  // Phase 2: replace this with real JWT cookie/token validation
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));

  // Placeholder: no enforcement yet
  if (isProtected || isPublic) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
