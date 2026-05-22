"use client";

/**
 * components/tickets/CreateTicketForm.tsx
 *
 * Modal/inline form for creating a new ticket.
 * Calls useCreateTicket mutation, closes on success.
 */
import { useState, FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateTicket, useTicketCategories } from "@/hooks/useTickets";
import type { TicketPriority } from "@/types";

interface CreateTicketFormProps {
  onClose: () => void;
}

export function CreateTicketForm({ onClose }: CreateTicketFormProps) {
  const { data: categories = [] } = useTicketCategories();
  const { mutate: createTicket, isPending, error } = useCreateTicket();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [categoryId, setCategoryId] = useState<number | "">("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createTicket(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        category_id: categoryId !== "" ? categoryId : null,
      },
      { onSuccess: onClose }
    );
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none " +
    "placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/40 " +
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
          <h2 className="text-sm font-semibold">New Ticket</h2>
          <button
            id="create-ticket-close"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {errorMsg && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="ticket-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="ticket-title"
              type="text"
              placeholder="Brief summary of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="ticket-description">
              Description
            </label>
            <textarea
              id="ticket-description"
              placeholder="Describe the issue in detail…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              disabled={isPending}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Priority + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="ticket-priority">
                Priority
              </label>
              <select
                id="ticket-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
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
              <label className="text-xs font-medium" htmlFor="ticket-category">
                Category
              </label>
              <select
                id="ticket-category"
                value={categoryId}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : "")
                }
                disabled={isPending}
                className={inputClass}
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              id="create-ticket-cancel"
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              id="create-ticket-submit"
              type="submit"
              size="sm"
              disabled={isPending || !title.trim()}
              className="min-w-[100px]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Creating…
                </span>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
