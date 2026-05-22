"use client";

/**
 * components/tasks/EditTaskForm.tsx
 *
 * Highly polished modal form for editing an existing task.
 * Supports updating Title, Description, Priority, Project, Assignee, and Due Date.
 */
import { useState, FormEvent, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateTask, useProjects, useUsers } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import type { TaskListItem, TaskPriority, TaskStatus } from "@/types";

interface EditTaskFormProps {
  task: TaskListItem;
  onClose: () => void;
}

export function EditTaskForm({ task, onClose }: EditTaskFormProps) {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects({ is_active: true });
  const { data: teamMembers = [], isError: usersError } = useUsers();
  const { mutate: updateTask, isPending, error } = useUpdateTask(task.id);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [projectId, setProjectId] = useState<number | "">(task.project?.id ?? "");
  const [assigneeId, setAssigneeId] = useState<number | "">(task.assigned_to?.id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");

  // Since TaskListItem doesn't carry full description, we fetch the detail in the parent or prefill if description exists.
  // We can also let the user enter a description if they need to.
  useEffect(() => {
    // If we have a description, let's set it. For safety we check if it is passed in task or fetch it if needed.
    // Since task is TaskListItem, description may be fetched or editable.
    if ("description" in task) {
      setDescription((task as any).description || "");
    }
  }, [task]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    updateTask(
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

  // Handle RBAC safely. If non-admin receives 403 fetching users, we list the current user and task's assignee.
  const selectMembers = (() => {
    if (usersError || teamMembers.length === 0) {
      const fallback: Array<{ id: number; full_name: string; email: string }> = [];
      if (user) {
        fallback.push({ id: user.id, full_name: user.full_name || user.email, email: user.email });
      }
      if (task.assigned_to && task.assigned_to.id !== user?.id) {
        fallback.push({
          id: task.assigned_to.id,
          full_name: task.assigned_to.full_name || task.assigned_to.email,
          email: task.assigned_to.email,
        });
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
            <h2 className="text-sm font-bold text-foreground">Edit Task Details</h2>
            <p className="text-[10px] text-muted-foreground">Task ID: #{task.id}</p>
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
            <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-title">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="edit-task-title"
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
            <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-description">
              Task Description
            </label>
            <textarea
              id="edit-task-description"
              placeholder="Add more details, links, or context…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-priority">
                Task Priority
              </label>
              <select
                id="edit-task-priority"
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
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-project">
                Bound Project
              </label>
              <select
                id="edit-task-project"
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
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-assignee">
                Assignee
              </label>
              <select
                id="edit-task-assignee"
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
              <label className="text-[11px] font-semibold text-muted-foreground uppercase" htmlFor="edit-task-due-date">
                Due Date
              </label>
              <input
                id="edit-task-due-date"
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
