"use client";

/**
 * app/(dashboard)/projects/page.tsx
 *
 * Project management page:
 * - List of org projects with progress bars
 * - Create project modal (admin/support_agent)
 * - Active/archived filter
 */
import { useState, FormEvent } from "react";
import Link from "next/link";
import {
  Plus,
  FolderOpen,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useProjects,
  useCreateProject,
  useDeleteProject,
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/types";

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function ProjectCard({
  project,
  canDelete,
  onDelete,
}: {
  project: Project;
  canDelete: boolean;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/tasks?project=${project.id}`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!project.is_active && (
            <span className="rounded-full bg-zinc-700/30 px-2 py-0.5 text-[10px] text-zinc-500">
              Inactive
            </span>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete project"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            {project.completed_task_count}/{project.task_count} tasks complete
          </span>
          <span className="font-medium text-foreground">
            {project.completion_pct}%
          </span>
        </div>
        <ProgressBar pct={project.completion_pct} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          by {project.created_by?.full_name || project.created_by?.email}
        </span>
        <Link
          href={`/tasks?project=${project.id}`}
          className="text-[11px] text-primary hover:underline"
        >
          View tasks →
        </Link>
      </div>
    </div>
  );
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const { mutate: createProject, isPending, error } = useCreateProject();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none " +
    "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 disabled:opacity-50";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createProject(
      { name: name.trim(), description: description.trim() },
      { onSuccess: onClose }
    );
  }

  const errorMsg =
    error && typeof error === "object" && "message" in error
      ? (error as Error).message
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">New Project</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="project-name">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="e.g. Q3 Infrastructure"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="project-description">
              Description
            </label>
            <textarea
              id="project-description"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              id="create-project-submit"
              type="submit"
              size="sm"
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const { data: projects = [], isLoading, isError, refetch, isFetching } = useProjects(
    filterActive !== undefined ? { is_active: filterActive } : {}
  );
  const { mutate: deleteProject } = useDeleteProject();

  const canCreate = user?.role === "admin" || user?.role === "support_agent";
  const canDelete = user?.role === "admin";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Projects</h2>
          <p className="text-xs text-muted-foreground">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          {canCreate && (
            <Button
              id="create-project-btn"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {(
          [
            { label: "All", value: undefined },
            { label: "Active", value: true },
            { label: "Inactive", value: false },
          ] as { label: string; value: boolean | undefined }[]
        ).map((opt) => (
          <button
            key={opt.label}
            onClick={() => setFilterActive(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              filterActive === opt.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">Failed to load projects.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
          {canCreate && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              Create your first project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              canDelete={canDelete}
              onDelete={(id) => deleteProject(id)}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
