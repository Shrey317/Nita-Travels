"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, AlertTriangle, AlertCircle, Info, Check, X } from "lucide-react";
import type { FleetNotification, NotificationPriority } from "@/lib/db/notifications";

const priorityConfig: Record<NotificationPriority, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  critical: { icon: AlertCircle, color: "text-status-red", bgColor: "bg-red-500/10" },
  warning: { icon: AlertTriangle, color: "text-status-yellow", bgColor: "bg-amber-500/10" },
  info: { icon: Info, color: "text-teal", bgColor: "bg-teal/10" },
};

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<FleetNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  useEffect(() => {
    // Load read IDs from localStorage
    try {
      const saved = localStorage.getItem("nita-read-notifications");
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data);
    } catch {
      // silently fail — notification panel is not critical path
    }
  };

  useEffect(() => {
    // Initial fetch
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    // Poll every 30 seconds to keep unread badge fresh without page reload
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function markRead(id: string) {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    try {
      localStorage.setItem("nita-read-notifications", JSON.stringify([...next]));
    } catch {
      // ignore storage errors
    }
  }

  function markAllRead() {
    const next = new Set(notifications.map((n) => n.id));
    setReadIds(next);
    try {
      localStorage.setItem("nita-read-notifications", JSON.stringify([...next]));
    } catch {
      // ignore
    }
  }

  function handleNotificationClick(notification: FleetNotification) {
    markRead(notification.id);
    setOpen(false);
    router.push(notification.href);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-muted hover:bg-card hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-red text-[10px] font-bold text-white shadow-[0_0_0_2px_rgb(var(--color-surface))]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-card shadow-card-elevated animate-scale-in origin-top-right"
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface hover:text-ink transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-muted hover:bg-surface hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                aria-label="Close notifications dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-teal" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted/40" />
                <p className="font-medium">All clear</p>
                <p className="mt-1">No notifications at this time.</p>
              </div>
            )}

            {!loading &&
              notifications.map((notification) => {
                const config = priorityConfig[notification.priority];
                const Icon = config.icon;
                const isRead = readIds.has(notification.id);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/50 focus-visible:outline-none focus-visible:bg-surface/80 ${
                      isRead ? "opacity-60" : ""
                    } border-b border-border/50 last:border-b-0`}
                    aria-label={`${isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                      <Icon className={`h-3.5 w-3.5 ${config.color}`} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm ${isRead ? "text-muted" : "font-medium text-ink"}`}>
                          {notification.title}
                        </p>
                        {!isRead && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{notification.description}</p>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <p className="text-center text-xs text-muted">
                {notifications.length} notification{notifications.length !== 1 ? "s" : ""} •{" "}
                {unreadCount} unread
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
