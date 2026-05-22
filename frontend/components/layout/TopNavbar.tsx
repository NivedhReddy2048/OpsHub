"use client";

/**
 * components/layout/TopNavbar.tsx
 *
 * Top navigation bar showing:
 * - Page title
 * - Search bar placeholder
 * - Theme toggle
 * - Notifications button
 * - User avatar with name initial + role badge
 * - Logout button (via AuthContext)
 */
import { useState, useRef, useEffect } from "react";
import { Bell, Search, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  support_agent: "Support Agent",
  team_member: "Team Member",
};

interface TopNavbarProps {
  title?: string;
}

export function TopNavbar({ title = "Dashboard" }: TopNavbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [shortcutText, setShortcutText] = useState("Ctrl+K");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      setShortcutText(isMac ? "⌘K" : "Ctrl+K");
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initial = user?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const displayName = user?.full_name || user?.email || "User";
  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : "";

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground shrink-0">{title}</h1>

      {/* Search placeholder */}
      <div 
        onClick={() => window.dispatchEvent(new CustomEvent("toggle-command-palette"))}
        className="ml-4 flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-accent/50 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent("toggle-command-palette"));
          }
        }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">Search tickets, tasks… ({shortcutText})</span>
      </div>

      {/* Actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            id="user-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {/* Avatar */}
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shrink-0">
              {initial}
            </div>
            <span className="hidden sm:block text-xs font-medium text-foreground max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDown
              className={cn(
                "hidden sm:block h-3 w-3 text-muted-foreground transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-popover shadow-lg z-50 py-1"
            >
              {/* User info */}
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
                {roleLabel && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{roleLabel}</p>
                )}
              </div>

              {/* Profile link placeholder */}
              <button
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors cursor-pointer"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                id="profile-menu-item"
              >
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                My Profile
              </button>

              {/* Logout */}
              <button
                role="menuitem"
                id="logout-btn"
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                onClick={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
