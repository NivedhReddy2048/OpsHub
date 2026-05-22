"use client";

/**
 * app/(dashboard)/notifications/page.tsx
 *
 * Full notifications inbox page.
 * Uses notificationService to retrieve organization notifications and SLA alerts, 
 * mark individual notifications as read, or mark all as read.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Inbox, 
  Loader2, 
  RefreshCw, 
  AlertTriangle,
  Clock,
} from "lucide-react";
import { notificationService } from "@/services/notificationService";
import type { Notification } from "@/types";

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: () => notificationService.getNotifications(),
    // Poll notifications every 10 seconds for real-time updates
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  const notifications = data?.results ?? [];
  const unreadCount = data?.unread_count ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-3">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
        <p className="text-sm font-semibold text-foreground">Failed to load notifications</p>
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h2>
          <p className="text-xs text-muted-foreground">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread system notifications` 
              : "All caught up! No unread notifications."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground px-3 py-1.5 text-xs font-semibold transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          )}

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-md border border-border bg-card p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications container */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Inbox is empty</p>
            <p className="text-xs text-muted-foreground">We'll alert you here when tickets or tasks are updated.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 flex gap-3 transition-colors ${
                  !notif.is_read ? "bg-primary/5 hover:bg-primary/10" : "bg-card hover:bg-muted/30"
                }`}
              >
                {/* Unread dot indicator */}
                <div className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-primary" style={{ opacity: notif.is_read ? 0 : 1 }} />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs ${!notif.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {notif.title}
                    </p>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {notif.message}
                  </p>
                </div>

                {/* Mark read button */}
                {!notif.is_read && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    disabled={markReadMutation.isPending}
                    className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors shrink-0 self-center"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
