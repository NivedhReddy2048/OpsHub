"use client";

/**
 * components/tickets/PriorityBadge.tsx
 *
 * Visual badge for ticket priority with an icon indicator.
 */
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowRight, ArrowUp, Zap } from "lucide-react";
import type { TicketPriority } from "@/types";

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; className: string; Icon: React.ElementType }
> = {
  low: {
    label: "Low",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Icon: ArrowDown,
  },
  medium: {
    label: "Medium",
    className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    Icon: ArrowRight,
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Icon: ArrowUp,
  },
  critical: {
    label: "Critical",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    Icon: Zap,
  },
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Icon: ArrowRight,
  };
  const { Icon } = config;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
