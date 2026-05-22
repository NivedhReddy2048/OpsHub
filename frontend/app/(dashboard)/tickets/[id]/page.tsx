"use client";

/**
 * app/(dashboard)/tickets/[id]/page.tsx
 *
 * Ticket detail page:
 * - Full ticket info with status/priority badges
 * - Status transition dropdown (admin/support agent)
 * - Description, comments, attachments
 */
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  User,
  Tag,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTicket, useTransitionTicket } from "@/hooks/useTickets";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { TicketComments } from "@/components/tickets/TicketComments";
import { TicketAttachments } from "@/components/tickets/TicketAttachments";
import { ConvertTicketModal } from "@/components/tasks/ConvertTicketModal";
import type { TicketStatus } from "@/types";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const ticketId = Number(params.id);
  const router = useRouter();
  const { user } = useAuth();
  const [showConvert, setShowConvert] = useState(false);

  const { data: ticket, isLoading, isError } = useTicket(ticketId);
  const { mutate: transition, isPending: isTransitioning } =
    useTransitionTicket(ticketId);

  const canManage =
    user?.role === "admin" || user?.role === "support_agent";

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">Ticket not found or failed to load.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/tickets"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Tickets
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-muted-foreground">#{ticket.id}</span>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold leading-snug">
                {ticket.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-mono">
                  #{ticket.id}
                </span>
                {ticket.category && (
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {ticket.category.name}
                  </span>
                )}
                {ticket.is_sla_breached && (
                  <span className="text-[11px] font-medium text-red-400">
                    ⚠ SLA Breached
                  </span>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          {/* Status transition + Convert button */}
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            {canManage && ticket.allowed_transitions.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">Move to:</span>
                {ticket.allowed_transitions.map((s) => (
                  <Button
                    key={s}
                    id={`transition-${s}`}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    disabled={isTransitioning}
                    onClick={() => transition(s)}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </>
            )}
            {canManage && (
              <Button
                id="convert-to-task-btn"
                size="sm"
                variant="outline"
                className="h-7 text-xs ml-auto gap-1 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => setShowConvert(true)}
              >
                <ArrowRight className="h-3 w-3" />
                Convert to Task
              </Button>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_240px]">
          {/* Left: description */}
          <div className="border-b border-border px-6 py-5 lg:border-b-0 lg:border-r">
            <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </h3>
            {ticket.description ? (
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No description provided.
              </p>
            )}
          </div>

          {/* Right: metadata */}
          <div className="px-6 py-5 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Details
            </h3>

            <MetaItem
              icon={User}
              label="Created by"
              value={
                ticket.created_by?.full_name ||
                ticket.created_by?.email ||
                "Unknown"
              }
            />
            <MetaItem
              icon={User}
              label="Assigned to"
              value={
                ticket.assigned_to
                  ? ticket.assigned_to.full_name || ticket.assigned_to.email
                  : "Unassigned"
              }
            />
            <MetaItem
              icon={CalendarDays}
              label="Created"
              value={formatDateTime(ticket.created_at)}
            />
            <MetaItem
              icon={Clock}
              label="Due"
              value={formatDateTime(ticket.due_at)}
            />
            {ticket.resolved_at && (
              <MetaItem
                icon={CheckCircle2}
                label="Resolved"
                value={formatDateTime(ticket.resolved_at)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <TicketAttachments
          ticketId={ticket.id}
          attachments={ticket.attachments}
        />
      </div>

      {/* Comments */}
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <TicketComments
          ticketId={ticket.id}
          comments={ticket.comments}
          isClosed={isClosed}
        />
      </div>

      {/* Convert to Task modal */}
      {showConvert && (
        <ConvertTicketModal
          ticket={ticket}
          onClose={() => setShowConvert(false)}
          onSuccess={(taskId) => router.push(`/tasks/${taskId}`)}
        />
      )}
    </div>
  );
}
