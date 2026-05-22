"use client";

/**
 * components/tickets/StatusBadge.tsx
 *
 * Visual badge for ticket status.
 * Colour-coded per status with a dot indicator.
 */
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types";

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; className: string }
> = {
  open: {
    label: "Open",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  assigned: {
    label: "Assigned",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  closed: {
    label: "Closed",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
};

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
