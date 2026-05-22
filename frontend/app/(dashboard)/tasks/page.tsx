"use client";

/**
 * app/(dashboard)/tasks/page.tsx
 *
 * Professional high-density enterprise Task Management dashboard.
 * Supports loading tasks, creating tasks, editing tasks via inline modals, 
 * filtering, project binding, overdue states, dynamic row mutations (status/priority/assignee),
 * animated skeletons, graceful empty views, and a non-blocking toast notification banner.
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "@/services/taskService";
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  FolderKanban,
  UserCheck,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useTasks, 
  useProjects, 
  useUsers, 
  useDeleteTask 
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { CreateTaskForm } from "@/components/tasks/CreateTaskForm";
import { EditTaskForm } from "@/components/tasks/EditTaskForm";
import type { TaskFilters, TaskStatus, TaskPriority, TaskListItem } from "@/types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TasksPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const defaultProject = searchParams.get("project")
    ? Number(searchParams.get("project"))
    : undefined;

  // Modals & Sidebars
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);

  // Notifications State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Search Input State
  const [searchInput, setSearchInput] = useState("");

  // Filters State
  const [filters, setFilters] = useState<TaskFilters>({
    page: 1,
    page_size: 25,
    project: defaultProject,
  });

  // Queries
  const { data, isLoading, isError, refetch, isFetching } = useTasks(filters);
  const { data: projects = [] } = useProjects({ is_active: true });
  const { data: teamMembers = [], isError: usersError } = useUsers();

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const hasFilters =
    filters.status || filters.priority || filters.project ||
    filters.is_overdue || filters.search;

  // Auto-fade toasts
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
  }

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
  }

  function clearFilters() {
    setSearchInput("");
    setFilters({ page: 1, page_size: 25 });
  }

  // Row Mutations
  const qc = useQueryClient();

  const transitionMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      taskService.transitionStatus(taskId, status),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, payload }: { taskId: number; payload: any }) =>
      taskService.updateTask(taskId, payload),
  });

  const deleteMutation = useDeleteTask();

  const handleInlineStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    try {
      await transitionMutation.mutateAsync(
        { taskId, status: newStatus },
        {
          onSuccess: () => {
            triggerToast(`Task status updated to ${newStatus.replace("_", " ")}`);
            refetch();
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to update status.";
            triggerToast(msg, "error");
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlinePriorityChange = async (taskId: number, newPriority: TaskPriority) => {
    try {
      await updateMutation.mutateAsync(
        { taskId, payload: { priority: newPriority } },
        {
          onSuccess: () => {
            triggerToast(`Task priority updated to ${newPriority}`);
            refetch();
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to update priority.";
            triggerToast(msg, "error");
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineAssigneeChange = async (taskId: number, assigneeId: number | "") => {
    try {
      await updateMutation.mutateAsync(
        {
          taskId,
          payload: { assigned_to_id: assigneeId === "" ? null : assigneeId },
        },
        {
          onSuccess: () => {
            triggerToast(assigneeId === "" ? "Task unassigned successfully" : "Task assignee updated successfully");
            refetch();
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to update assignee.";
            triggerToast(msg, "error");
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm("Are you sure you want to delete this task? This action is permanent.")) return;
    try {
      deleteMutation.mutate(taskId, {
        onSuccess: () => {
          triggerToast("Task deleted successfully");
          refetch();
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || "Failed to delete task.";
          triggerToast(msg, "error");
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Safe Assignee options fallback for RBAC users
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

  return (
    <div className="space-y-6 max-w-full">
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-xs font-semibold shadow-2xl transition-all duration-300 animate-slide-in ${
          toastMessage.type === "success" 
            ? "bg-green-500/10 border border-green-500/20 text-green-400" 
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Sprint Task Management</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {totalCount} Active {totalCount === 1 ? "Task" : "Tasks"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plan, assign, filter, and track development sprints and ticket conversions.
          </p>
        </div>
        <Button
          id="create-task-btn"
          size="sm"
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          Add Sprint Task
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 bg-card/40 p-3 rounded-xl border border-border">
        {/* Search Input */}
        <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            id="task-search"
            type="text"
            placeholder="Search sprint task title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setFilters((f) => ({ ...f, search: undefined, page: 1 }));
              }}
              className="text-muted-foreground hover:text-foreground text-sm font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Select */}
        <select
          id="filter-task-status"
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as TaskStatus) || undefined,
              page: 1,
            }))
          }
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/80"
        >
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Completed</option>
          <option value="archived">Archived</option>
        </select>

        {/* Priority Select */}
        <select
          id="filter-task-priority"
          value={filters.priority ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              priority: (e.target.value as TaskPriority) || undefined,
              page: 1,
            }))
          }
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/80"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Project Select */}
        {projects.length > 0 && (
          <select
            id="filter-task-project"
            value={filters.project ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                project: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/80"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        {/* Overdue Checkbox */}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none bg-background border border-border px-2.5 py-1.5 rounded-md hover:bg-muted/40 transition-colors">
          <input
            type="checkbox"
            checked={filters.is_overdue ?? false}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                is_overdue: e.target.checked || undefined,
                page: 1,
              }))
            }
            className="rounded border-border text-primary focus:ring-0"
          />
          Overdue only
        </label>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Clear filters
          </button>
        )}

        {/* Refresh button */}
        <button
          id="refresh-tasks"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
        </button>
      </div>

      {/* Main Table Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          /* High-fidelity pulse animation skeletons */
          <div className="divide-y divide-border">
            <div className="border-b border-border bg-muted/40 h-10 w-full animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 space-y-2.5 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-2/5" />
                  <div className="h-4 bg-muted rounded w-1/12" />
                </div>
                <div className="flex gap-4">
                  <div className="h-3 bg-muted rounded w-16" />
                  <div className="h-3 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Styled non-blocking inline error screen */
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
            <div className="rounded-full bg-red-500/10 p-3 border border-red-500/20">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Failed to synchronize tasks</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                We encountered a connection interruption with the platform API or your organization scope has been bound elsewhere.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs gap-1">
              <RefreshCw className="h-3 w-3" />
              Retry Connection
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          /* Graceful empty state matching Linear/Jira */
          <div className="py-16 text-center max-w-sm mx-auto space-y-4">
            <div className="mx-auto rounded-full bg-primary/5 p-4 border border-primary/10 w-fit">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {hasFilters ? "No matches found" : "Clean workspace"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-normal">
                {hasFilters 
                  ? "Adjust or clear your search criteria to view hidden sprint cards." 
                  : "All sprint task columns are clear. Begin by mapping out a new task."}
              </p>
            </div>
            {!hasFilters && (
              <Button size="sm" onClick={() => setShowCreate(true)} className="text-xs bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-3 w-12 text-center">ID</th>
                  <th className="px-4 py-3">Task Details</th>
                  <th className="px-4 py-3 w-36">Status</th>
                  <th className="px-4 py-3 w-36">Priority</th>
                  <th className="px-4 py-3 w-40">Bound Project</th>
                  <th className="px-4 py-3 w-40">Assignee</th>
                  <th className="px-4 py-3 w-32 hidden xl:table-cell">Due Date</th>
                  <th className="px-4 py-3 w-16 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="group bg-card hover:bg-muted/20 transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 text-center text-muted-foreground font-mono">
                      #{task.id}
                    </td>

                    {/* Title & metadata */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="font-semibold text-foreground hover:text-primary transition-colors text-xs line-clamp-1"
                        >
                          {task.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          {task.is_overdue && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/20 uppercase">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Overdue
                            </span>
                          )}
                          {task.linked_ticket_id && (
                            <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1 rounded">
                              Linked Ticket: #{task.linked_ticket_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Inline Status Selection */}
                    <td className="px-4 py-3.5">
                      <select
                        value={task.status}
                        onChange={(e) => handleInlineStatusChange(task.id, e.target.value as TaskStatus)}
                        className="rounded border border-border/80 bg-background/50 px-2 py-1 text-[11px] text-foreground outline-none focus:border-primary w-fit cursor-pointer hover:bg-background/90"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">In Review</option>
                        <option value="done">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>

                    {/* Inline Priority Selection */}
                    <td className="px-4 py-3.5">
                      <select
                        value={task.priority}
                        onChange={(e) => handleInlinePriorityChange(task.id, e.target.value as TaskPriority)}
                        className="rounded border border-border/80 bg-background/50 px-2 py-1 text-[11px] text-foreground outline-none focus:border-primary w-fit cursor-pointer hover:bg-background/90"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3.5 text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        <span className="truncate max-w-[120px]">{task.project?.name ?? "No Project"}</span>
                      </div>
                    </td>

                    {/* Inline Assignee Selection */}
                    <td className="px-4 py-3.5">
                      <select
                        value={task.assigned_to?.id ?? ""}
                        onChange={(e) => handleInlineAssigneeChange(task.id, e.target.value ? Number(e.target.value) : "")}
                        className="rounded border border-border/80 bg-background/50 px-2 py-1 text-[11px] text-foreground outline-none focus:border-primary w-full max-w-[140px] cursor-pointer hover:bg-background/90"
                      >
                        <option value="">Unassigned</option>
                        {selectMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name || m.email}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Due date */}
                    <td className="px-4 py-3.5 text-muted-foreground font-medium hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingTask(task)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                          title="Edit Task Details"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {user?.role === "admin" && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-400 transition-all"
                            title="Delete Task"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {data && totalCount > (filters.page_size ?? 25) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border">
          <span>
            Showing Page <strong className="text-foreground">{filters.page ?? 1}</strong> of{" "}
            <strong>{Math.ceil(totalCount / (filters.page_size ?? 25))}</strong>
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data.previous}
              className="text-xs h-8"
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!data.next}
              className="text-xs h-8"
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      {showCreate && (
        <CreateTaskForm
          onClose={() => {
            setShowCreate(false);
            refetch();
          }}
          defaultProjectId={filters.project}
        />
      )}

      {/* Task Editing Modal */}
      {editingTask && (
        <EditTaskForm
          task={editingTask}
          onClose={() => {
            setEditingTask(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
