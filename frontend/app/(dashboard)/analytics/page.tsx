"use client";

/**
 * app/(dashboard)/analytics/page.tsx
 *
 * Operations and SLA analytics page.
 * Uses analyticsService.getDashboardMetrics() to render beautiful charts, 
 * summary counters, SLA breach statuses, and progress indicators.
 */
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Ticket, 
  ShieldAlert, 
  Briefcase,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { analyticsService } from "@/services/analyticsService";
import type { DashboardMetrics } from "@/types";

export default function AnalyticsPage() {
  const { data: metrics, isLoading, isError, refetch, isFetching } = useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics"],
    queryFn: () => analyticsService.getDashboardMetrics(),
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="text-sm font-semibold text-foreground">Failed to load analytics metrics</p>
        <p className="text-xs text-muted-foreground">The analytics backend API may be offline or initializing.</p>
        <button 
          onClick={() => refetch()} 
          className="inline-flex items-center gap-1.5 rounded-md bg-muted hover:bg-muted/85 px-3 py-1.5 text-xs text-foreground font-medium transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }

  const ticketStatusLabels: Record<string, string> = {
    new: "New",
    open: "Open",
    pending: "Pending",
    resolved: "Resolved",
    closed: "Closed",
  };

  const priorityLabels: Record<string, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance & SLA Analytics
          </h2>
          <p className="text-xs text-muted-foreground">
            Real-time operations metrics, SLA tracking, and project progress
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Open Tickets */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Open Tickets</span>
            <Ticket className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.total_open_tickets}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active Helpdesk customer requests</p>
          </div>
        </div>

        {/* Breached SLAs */}
        <div className={`rounded-xl border p-4 space-y-2 flex flex-col justify-between ${
          metrics.breached_slas > 0 
            ? "border-red-500/30 bg-red-500/5" 
            : "border-border bg-card"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">SLA Breaches</span>
            <ShieldAlert className={`h-4 w-4 ${metrics.breached_slas > 0 ? "text-red-400" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${metrics.breached_slas > 0 ? "text-red-400" : "text-foreground"}`}>
              {metrics.breached_slas}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tickets exceeding response/resolution times</p>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Tasks</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {metrics.active_tasks}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">In-progress and pending sprint tasks</p>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className={`rounded-xl border p-4 space-y-2 flex flex-col justify-between ${
          metrics.overdue_tasks > 0 
            ? "border-amber-500/30 bg-amber-500/5" 
            : "border-border bg-card"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue Tasks</span>
            <AlertTriangle className={`h-4 w-4 ${metrics.overdue_tasks > 0 ? "text-amber-400" : "text-muted-foreground"}`} />
          </div>
          <div>
            <h3 className={`text-2xl font-bold tracking-tight ${metrics.overdue_tasks > 0 ? "text-amber-400" : "text-foreground"}`}>
              {metrics.overdue_tasks}
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Tasks missing their scheduled deadline</p>
          </div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Breakdown card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Ticket className="h-4 w-4 text-primary" />
            Ticket Distribution
          </h3>

          <div className="space-y-4">
            {/* Status Breakdown */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase">By Status</h4>
              {metrics.ticket_status_breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No ticket status data available.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.ticket_status_breakdown.map((item) => {
                    const pct = metrics.total_open_tickets > 0 
                      ? Math.round((item.count / metrics.total_open_tickets) * 100) 
                      : 0;
                    return (
                      <div key={item.status} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>{ticketStatusLabels[item.status] ?? item.status}</span>
                          <span className="text-muted-foreground">{item.count} tickets</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-blue-500 transition-all duration-500" 
                            style={{ width: `${Math.max(5, Math.min(100, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority Breakdown */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase">By Priority</h4>
              {metrics.ticket_priority_breakdown.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No ticket priority data available.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.ticket_priority_breakdown.map((item) => {
                    const isCritical = item.priority === "critical" || item.priority === "high";
                    return (
                      <div key={item.priority} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/30">
                        <span className="font-medium">{priorityLabels[item.priority] ?? item.priority}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                          isCritical ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {item.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task & Projects Breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-primary" />
              Project Sprint Progress
            </h3>

            {metrics.project_completion_summary.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-muted-foreground italic">No active projects or task completions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.project_completion_summary.map((proj) => (
                  <div key={proj.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate">{proj.name}</span>
                      <span className="text-muted-foreground font-mono">
                        {proj.completed_tasks}/{proj.total_tasks} Tasks ({proj.completion_pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-green-500 transition-all duration-500" 
                        style={{ width: `${proj.completion_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-400" />
              <span>Completed tasks: {metrics.completed_tasks}</span>
            </div>
            <span>Active Project scope: {metrics.project_completion_summary.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
