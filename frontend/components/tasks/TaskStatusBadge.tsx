"use client";

/**
 * components/tasks/TaskStatusBadge.tsx
 */
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  review: {
    label: "In Review",
    className: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  done: {
    label: "Done",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-700/30 text-zinc-500 border-zinc-700/30",
  },
};

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.todo;
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
