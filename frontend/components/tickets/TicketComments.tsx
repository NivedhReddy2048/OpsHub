"use client";

/**
 * components/tickets/TicketComments.tsx
 *
 * Comment thread for a ticket detail page.
 * - Shows public + internal comments (internal styled distinctly)
 * - Add comment form with internal toggle for admins/support agents
 * - Delete own comment (or any as admin)
 */
import { useState, FormEvent } from "react";
import { Lock, MessageSquare, Trash2 } from "lucide-react";
import { useAddComment, useDeleteComment } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TicketComment } from "@/types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserAvatar({ name }: { name: string }) {
  const initial = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {initial}
    </div>
  );
}

interface CommentItemProps {
  comment: TicketComment;
  ticketId: number;
  currentUserId: number | undefined;
  isAdmin: boolean;
}

function CommentItem({
  comment,
  ticketId,
  currentUserId,
  isAdmin,
}: CommentItemProps) {
  const { mutate: deleteComment, isPending } = useDeleteComment(ticketId);
  const canDelete = isAdmin || comment.author?.id === currentUserId;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3",
        comment.is_internal
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-border bg-card"
      )}
    >
      <UserAvatar name={comment.author?.full_name || comment.author?.email || "?"} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-foreground">
            {comment.author?.full_name || comment.author?.email || "Unknown"}
          </span>
          {comment.is_internal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
              <Lock className="h-2.5 w-2.5" />
              Internal
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {formatDateTime(comment.created_at)}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
      {canDelete && (
        <button
          onClick={() => deleteComment(comment.id)}
          disabled={isPending}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          aria-label="Delete comment"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

interface TicketCommentsProps {
  ticketId: number;
  comments: TicketComment[];
  isClosed: boolean;
}

export function TicketComments({
  ticketId,
  comments,
  isClosed,
}: TicketCommentsProps) {
  const { user } = useAuth();
  const { mutate: addComment, isPending } = useAddComment(ticketId);
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const canWriteInternal =
    user?.role === "admin" || user?.role === "support_agent";
  const isAdmin = user?.role === "admin";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || isClosed) return;
    addComment(
      { content: content.trim(), isInternal },
      { onSuccess: () => setContent("") }
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comments{" "}
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {comments.length}
          </span>
        </h3>
      </div>

      {/* Comment list */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              ticketId={ticketId}
              currentUserId={user?.id}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>

      {/* Add comment form */}
      {!isClosed && (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2">
          <textarea
            id="comment-input"
            placeholder={
              isInternal ? "Add internal note…" : "Add a comment…"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            disabled={isPending}
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none resize-none",
              "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40",
              "disabled:opacity-50 transition-colors",
              isInternal ? "border-amber-500/40" : "border-border"
            )}
          />
          <div className="flex items-center justify-between gap-2">
            {/* Internal toggle */}
            {canWriteInternal && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground select-none">
                <div
                  onClick={() => setIsInternal((v) => !v)}
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                    isInternal
                      ? "border-amber-500 bg-amber-500 text-white"
                      : "border-border bg-background"
                  )}
                >
                  {isInternal && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 fill-current">
                      <path d="M10 3L5 8.5 2 5.5 1 6.5l4 4 6-7z" />
                    </svg>
                  )}
                </div>
                <Lock className="h-3 w-3" />
                Internal note
              </label>
            )}
            <Button
              id="comment-submit"
              type="submit"
              size="sm"
              disabled={isPending || !content.trim()}
              className="ml-auto"
            >
              {isPending ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      )}

      {isClosed && (
        <p className="text-center text-xs text-muted-foreground">
          This ticket is closed — no new comments can be added.
        </p>
      )}
    </div>
  );
}
