"use client";

/**
 * components/layout/Sidebar.tsx
 *
 * Role-aware sidebar navigation.
 * - Admin sees: all sections including Audit Log
 * - Support Agent sees: Tickets, Dashboard, Team, Notifications
 * - Team Member sees: Dashboard, Tasks, Projects, Notifications
 *
 * Uses useAuth() to get the current user's role.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  CheckSquare,
  Building2,
  Users,
  BarChart3,
  Bell,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

// ─── Nav item definition ──────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** If set, only users with one of these roles see this item */
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tickets",
    href: "/tickets",
    icon: Ticket,
    roles: ["admin", "support_agent"],
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["admin", "team_member"],
  },
  {
    label: "Projects",
    href: "/projects",
    icon: Building2,
    roles: ["admin", "team_member"],
  },
  {
    label: "Team",
    href: "/team",
    icon: Users,
    roles: ["admin", "support_agent"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    label: "Audit Log",
    href: "/audit",
    icon: Shield,
    roles: ["admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? null;

  function isVisible(item: NavItem): boolean {
    if (!item.roles) return true; // No restriction
    if (!role) return false;       // No user yet
    return item.roles.includes(role);
  }

  function NavLink({ item }: { item: NavItem }) {
    if (!isVisible(item)) return null;
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">OH</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">OpsHub</span>
        <span className="ml-auto rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Beta
        </span>
      </div>

      {/* Organization name */}
      {user?.organization_name && (
        <div className="border-b border-border px-4 py-2">
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {user.organization_name}
          </p>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="flex flex-col gap-0.5 border-t border-border px-2 py-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </div>
    </aside>
  );
}
