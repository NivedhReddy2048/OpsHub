"use client";

/**
 * app/(dashboard)/tickets/page.tsx
 *
 * Ticket list page with:
 * - Paginated table view
 * - Status / priority / search filters
 * - Create ticket button (admin + support_agent only)
 * - Loading / error / empty states
 */
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTickets, useTicketCategories } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm";
import type { TicketFilters, TicketStatus, TicketPriority } from "@/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, page_size: 25 });
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useTickets(filters);
  const { data: categories = [] } = useTicketCategories();

  const canCreate = user?.role === "admin" || user?.role === "support_agent";
  const tickets = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  function applySearch() {
    setFilters((f) => ({ ...f, search: searchInput.trim() || undefined, page: 1 }));
  }

  function clearFilters() {
    setSearchInput("");
    setFilters({ page: 1, page_size: 25 });
  }

  const hasActiveFilters =
    filters.status || filters.priority || filters.search || filters.category;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Tickets</h2>
          <p className="text-xs text-muted-foreground">
            {totalCount} {totalCount === 1 ? "ticket" : "tickets"} in your organization
          </p>
        </div>
        {canCreate && (
          <Button
            id="create-ticket-btn"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            id="ticket-search"
            type="text"
            placeholder="Search title or description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setFilters((f) => ({ ...f, search: undefined, page: 1 }));
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          id="filter-status"
          value={filters.status ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: (e.target.value as TicketStatus) || undefined,
              page: 1,
            }))
          }
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        {/* Priority filter */}
        <select
          id="filter-priority"
          value={filters.priority ?? ""}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              priority: (e.target.value as TicketPriority) || undefined,
              page: 1,
            }))
          }
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Category filter */}
        {categories.length > 0 && (
          <select
            id="filter-category"
            value={filters.category ?? ""}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                category: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              }))
            }
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Clear filters
          </button>
        )}

        {/* Refresh */}
        <button
          id="refresh-tickets"
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">Loading tickets…</p>
            </div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">Failed to load tickets.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No tickets match the current filters."
                : "No tickets yet. Create your first one."}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground w-12">#</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Status</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Priority</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Assigned To</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="group bg-card hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    #{ticket.id}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {ticket.title}
                    </Link>
                    {ticket.category && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {ticket.category.name}
                      </span>
                    )}
                    {ticket.is_sla_breached && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-red-400">
                        ⚠ SLA Breached
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {ticket.assigned_to
                      ? ticket.assigned_to.full_name || ticket.assigned_to.email
                      : "—"}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDate(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && totalCount > (filters.page_size ?? 25) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {filters.page ?? 1} of{" "}
            {Math.ceil(totalCount / (filters.page_size ?? 25))}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!data.previous}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!data.next}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showCreate && (
        <CreateTicketForm onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
