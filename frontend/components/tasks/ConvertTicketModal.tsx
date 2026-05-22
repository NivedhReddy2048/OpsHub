"use client";

/**
 * components/tasks/ConvertTicketModal.tsx
 *
 * Modal for converting a helpdesk ticket into an internal task.
 * Shown on the ticket detail page for admins/support agents.
 * Pre-fills title/description from the ticket; user can override.
 */
import { useState, FormEvent } from "react";
import { X, ArrowRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConvertTicketToTask } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useTasks";
import type { TicketListItem, TaskPriority } from "@/types";

interface ConvertTicketModalProps {
  ticket: Pick<TicketListItem, "id" | "title" | "priority"> & {
    description?: string;
  };
  onClose: () => void;
  onSuccess?: (taskId: number) => void;
}

const PRIORITY_MAP: Record<string, TaskPriority> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
};

export function ConvertTicketModal({
  ticket,
  onClose,
  onSuccess,
}: ConvertTicketModalProps) {
  const { data: projects = [] } = useProjects({ is_active: true });
  const { mutate: convert, isPending, error } = useConvertTicketToTask();

  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(
    (ticket as { description?: string }).description || ""
  );
  const [priority, setPriority] = useState<TaskPriority>(
    PRIORITY_MAP[ticket.priority] ?? "medium"
  );
  const [projectId, setProjectId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    convert(
      {
        ticketId: ticket.id,
        payload: {
          title: title.trim(),
          description: description.trim(),
          priority,
          project_id: projectId !== "" ? projectId : null,
          due_date: dueDate || null,
        },
      },
      {
        onSuccess: (task) => {
          onSuccess?.(task.id);
          onClose();
        },
      }
    );
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none " +
    "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 " +
    "disabled:opacity-50 transition-colors";

  const errorMsg =
    error && typeof error === "object" && "message" in error
      ? (error as Error).message
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Convert Ticket to Task</h2>
          </div>
          <button
            id="convert-ticket-close"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Source info */}
        <div className="border-b border-border bg-muted/30 px-5 py-3">
          <p className="text-[11px] text-muted-foreground">From ticket</p>
          <p className="text-xs font-medium text-foreground">
            #{ticket.id} — {ticket.title}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="convert-title">
              Task Title
            </label>
            <input
              id="convert-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="convert-description">
              Description
            </label>
            <textarea
              id="convert-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="convert-priority">
                Priority
              </label>
              <select
                id="convert-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={isPending}
                className={inputClass}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="convert-project">
                Assign to Project
              </label>
              <select
                id="convert-project"
                value={projectId}
                onChange={(e) =>
                  setProjectId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPending}
                className={inputClass}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="convert-due-date">
              Due Date
            </label>
            <input
              id="convert-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isPending}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              id="convert-ticket-submit"
              type="submit"
              size="sm"
              disabled={isPending || !title.trim()}
              className="gap-1.5 min-w-[130px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Converting…
                </span>
              ) : (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
