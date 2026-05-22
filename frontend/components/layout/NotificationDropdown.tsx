"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function NotificationDropdown() {
  const { data, isLoading } = useNotifications();
  const { mutate: markAsRead } = useMarkNotificationRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsRead();
  
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = data?.results || [];
  const unreadCount = data?.unread_count || 0;

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8"
        aria-label="Notifications"
        id="notifications-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 shrink-0">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Bell className="mx-auto mb-2 h-6 w-6 opacity-20" />
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  let href = "#";
                  if (n.related_object_type === "ticket") href = `/tickets/${n.related_object_id}`;
                  if (n.related_object_type === "task") href = `/tasks/${n.related_object_id}`;

                  return (
                    <div
                      key={n.id}
                      className={cn(
                        "relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 group",
                        !n.is_read ? "bg-primary/5" : ""
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            setIsOpen(false);
                          }}
                          className="block"
                        >
                          <p className={cn("text-xs font-medium", !n.is_read ? "text-foreground" : "text-foreground/80")}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </Link>
                      </div>
                      {!n.is_read && (
                        <button
                          title="Mark as read"
                          onClick={() => markAsRead(n.id)}
                          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="flex h-2 w-2 rounded-full bg-primary" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
