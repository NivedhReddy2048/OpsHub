"use client";

/**
 * app/(dashboard)/tasks/[id]/page.tsx
 *
 * Task detail page: metadata, status transitions, linked ticket reference,
 * comments section.
 */
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, AlertCircle, Clock, User, FolderOpen,
  CalendarDays, CheckCircle2, Link2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTask, useTransitionTask } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskComments } from "@/components/tasks/TaskComments";
import type { TaskStatus } from "@/types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
  archived: "Archived",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="text-xs font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();

  const { data: task, isLoading, isError } = useTask(taskId);
  const { mutate: transition, isPending: isTransitioning } = useTransitionTask(taskId);

  const canManage =
    user?.role === "admin" || user?.role === "support_agent" ||
    (user?.role === "team_member" && task?.assigned_to?.id === user?.id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">Task not found or failed to load.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const isArchived = task.status === "archived";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Tasks
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-muted-foreground">#{task.id}</span>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold leading-snug">
                  {task.title}
                </h1>
                {task.is_overdue && (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Overdue
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">
                  #{task.id}
                </span>
                {task.project && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    <FolderOpen className="h-3 w-3" />
                    {task.project.name}
                  </span>
                )}
                {task.linked_ticket && (
                  <Link
                    href={`/tickets/${task.linked_ticket.id}`}
                    className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    Ticket #{task.linked_ticket.id}
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>

          {/* Status transitions */}
          {canManage && task.allowed_transitions.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Move to:</span>
              {task.allowed_transitions.map((s) => (
                <Button
                  key={s}
                  id={`transition-task-${s}`}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={isTransitioning}
                  onClick={() => transition(s)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Body — two columns */}
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_220px]">
          {/* Description */}
          <div className="border-b border-border px-6 py-5 lg:border-b-0 lg:border-r">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </h3>
            {task.description ? (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided.
              </p>
            )}

            {/* Linked ticket detail */}
            {task.linked_ticket && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="mb-1 text-[11px] font-medium text-primary/80">
                  Converted from Ticket
                </p>
                <Link
                  href={`/tickets/${task.linked_ticket.id}`}
                  className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                >
                  #{task.linked_ticket.id} — {task.linked_ticket.title}
                </Link>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="px-6 py-5 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Details
            </h3>
            <MetaItem
              icon={User}
              label="Created by"
              value={
                task.created_by?.full_name || task.created_by?.email || "Unknown"
              }
            />
            <MetaItem
              icon={User}
              label="Assigned to"
              value={
                task.assigned_to
                  ? task.assigned_to.full_name || task.assigned_to.email
                  : "Unassigned"
              }
            />
            <MetaItem
              icon={CalendarDays}
              label="Due Date"
              value={
                task.due_date ? (
                  <span className={task.is_overdue ? "text-red-400" : ""}>
                    {formatDate(task.due_date)}
                  </span>
                ) : (
                  "No due date"
                )
              }
            />
            {task.completed_at && (
              <MetaItem
                icon={CheckCircle2}
                label="Completed"
                value={formatDate(task.completed_at)}
              />
            )}
            <MetaItem
              icon={Clock}
              label="Created"
              value={formatDate(task.created_at)}
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <TaskComments
          taskId={task.id}
          comments={task.comments}
          isArchived={isArchived}
        />
      </div>
    </div>
  );
}
