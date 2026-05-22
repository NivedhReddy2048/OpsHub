"use client";

/**
 * components/tasks/CreateTaskForm.tsx
 *
 * Highly polished modal form for creating a new task.
 * Supports title, description, priority, project binding, assignee binding, and due dates.
 */
import { useState, FormEvent } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTask, useProjects, useUsers } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import type { TaskPriority } from "@/types";

interface CreateTaskFormProps {
  onClose: () => void;
  defaultProjectId?: number;
}

export function CreateTaskForm({ onClose, defaultProjectId }: CreateTaskFormProps) {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects({ is_active: true });
  const { data: teamMembers = [], isError: usersError } = useUsers();
  const { mutate: createTask, isPending, error } = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [projectId, setProjectId] = useState<number | "">(defaultProjectId ?? "");
  const [assigneeId, setAssigneeId] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    createTask(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        project_id: projectId !== "" ? projectId : null,
        assigned_to_id: assigneeId !== "" ? assigneeId : null,
        due_date: dueDate || null,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }

  // Handle RBAC safely. If users endpoint throws a 403 or is empty, we fall back to self-assignment.
  const selectMembers = (() => {
    if (usersError || teamMembers.length === 0) {
      const fallback: Array<{ id: number; full_name: string; email: string }> = [];
      if (user) {
        fallback.push({ id: user.id, full_name: user.full_name || user.email, email: user.email });
      }
      return fallback;
    }
    return teamMembers;
  })();

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none " +
    "placeholder:text-muted-foreground focus:border-primary/80 " +
    "disabled:opacity-50 transition-colors";

  const errorMsg =
    error && typeof error === "object" && "message" in error
      ? (error as Error).message
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Create New Task</h2>
            <p className="text-[10px] text-muted-foreground">Add a new operational sprint or ticket task</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {errorMsg && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-title">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="create-task-title"
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-description">
              Description
            </label>
            <textarea
              id="create-task-description"
              placeholder="Add more details, instructions, or links…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-priority">
                Priority
              </label>
              <select
                id="create-task-priority"
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

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-project">
                Bound Project
              </label>
              <select
                id="create-task-project"
                value={projectId}
                onChange={(e) =>
                  setProjectId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPending}
                className={inputClass}
              >
                <option value="">No Project Assigned</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-assignee">
                Assignee
              </label>
              <select
                id="create-task-assignee"
                value={assigneeId}
                onChange={(e) =>
                  setAssigneeId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPending}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {selectMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="create-task-due-date">
                Due Date
              </label>
              <input
                id="create-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
                className={inputClass}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !title.trim()}
              className="text-xs bg-primary text-primary-foreground hover:bg-primary/95 font-semibold"
            >
              {isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
