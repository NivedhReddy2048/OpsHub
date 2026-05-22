"use client";

/**
 * components/tasks/TaskComments.tsx
 *
 * Simple (no internal/public split) comment thread for tasks.
 */
import { useState, FormEvent } from "react";
import { MessageSquare, Trash2 } from "lucide-react";
import { useAddTaskComment, useDeleteTaskComment } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import type { TaskComment } from "@/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

interface TaskCommentsProps {
  taskId: number;
  comments: TaskComment[];
  isArchived: boolean;
}

export function TaskComments({ taskId, comments, isArchived }: TaskCommentsProps) {
  const { user } = useAuth();
  const { mutate: addComment, isPending } = useAddTaskComment(taskId);
  const { mutate: deleteComment } = useDeleteTaskComment(taskId);
  const [content, setContent] = useState("");
  const isAdmin = user?.role === "admin";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    addComment(content.trim(), { onSuccess: () => setContent("") });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comments{" "}
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {comments.length}
          </span>
        </h3>
      </div>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <UserAvatar
                name={c.author?.full_name || c.author?.email || "?"}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">
                    {c.author?.full_name || c.author?.email}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    {formatDateTime(c.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
              {(isAdmin || c.author?.id === user?.id) && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!isArchived ? (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
          <input
            id="task-comment-input"
            type="text"
            placeholder="Add a comment…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isPending}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          />
          <Button
            id="task-comment-submit"
            type="submit"
            size="sm"
            disabled={isPending || !content.trim()}
          >
            {isPending ? "…" : "Send"}
          </Button>
        </form>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          This task is archived — comments are locked.
        </p>
      )}
    </div>
  );
}
