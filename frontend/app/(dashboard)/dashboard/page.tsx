"use client";

import { useDashboardMetrics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Clock, Activity, FileText } from "lucide-react";

export default function DashboardPage() {
  const { data: metrics, isLoading, isError } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p>Failed to load dashboard metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Overview</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_open_tickets}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Breached SLAs</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{metrics.breached_slas}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_tasks}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-500">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{metrics.overdue_tasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Ticket Breakdown */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Ticket Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.ticket_status_breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            ) : (
              <div className="space-y-3">
                {metrics.ticket_status_breakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.status.replace("_", " ")}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Breakdown */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.task_status_breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks yet.</p>
            ) : (
              <div className="space-y-3">
                {metrics.task_status_breakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{item.status.replace("_", " ")}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Completion */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.project_completion_summary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active projects.</p>
          ) : (
            <div className="space-y-4">
              {metrics.project_completion_summary.map((project) => (
                <div key={project.id} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {project.completed_tasks} / {project.total_tasks} tasks ({project.completion_pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(project.completion_pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
