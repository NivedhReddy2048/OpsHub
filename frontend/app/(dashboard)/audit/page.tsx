"use client";

import { useAuditLogs } from "@/hooks/useAudit";
import { AlertCircle, Clock, Activity, CheckCircle2, Ticket, CheckSquare, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const ACTION_ICONS: Record<string, React.ElementType> = {
  ticket_created: Ticket,
  ticket_status_changed: Activity,
  ticket_assigned: CheckCircle2,
  task_created: CheckSquare,
  task_assigned: CheckCircle2,
  ticket_converted: Ticket,
  comment_added: MessageSquare,
  sla_breached: AlertCircle,
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useAuditLogs();

  if (user?.role !== "admin") {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-destructive">You do not have permission to view audit logs.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p>Failed to load audit logs.</p>
      </div>
    );
  }

  const logs = data.results || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Audit Log Timeline</h2>
          <p className="text-xs text-muted-foreground mt-1">System-wide event history</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No events recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-border pl-6 space-y-8">
            {logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] || Activity;
              return (
                <div key={log.id} className="relative">
                  {/* Timeline dot/icon */}
                  <div className="absolute -left-10 top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-4 border-card bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-foreground">
                        {log.action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </p>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{log.actor_name}</span>{" "}
                      acted on {log.target_type} <span className="font-mono text-foreground/80">#{log.target_id}</span>
                    </p>
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
