"use client";

import { useState } from "react";
import Link from "next/link";
import { useFleetNotifications } from "@/lib/hooks/use-fleet-notifications";
import { Bell, AlertTriangle, AlertCircle, Info, Check } from "lucide-react";
import type { NotificationPriority } from "@/lib/db/notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const priorityConfig: Record<NotificationPriority, { Icon: typeof AlertTriangle; color: string; label: string }> = {
  critical: { Icon: AlertCircle, color: "text-status-error", label: "Critical" },
  warning: { Icon: AlertTriangle, color: "text-status-warning", label: "Warning" },
  info: { Icon: Info, color: "text-primary", label: "Information" },
};

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { data: notifications = [], unreadData, markRead, error, isLoading, mutate } = useFleetNotifications();
  const unreadCount = unreadData.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-button text-muted hover:bg-card hover:text-ink"
          aria-label={`Notifications${unreadCount ? ` — ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute right-0 top-0 rounded-full bg-status-error px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] max-w-[calc(100vw-2rem)] p-0" aria-label="Notifications">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markRead(notifications.map((item) => item.id))}
              className="flex min-h-8 items-center gap-1 rounded px-1 text-xs text-muted hover:text-ink"
            >
              <Check className="h-3 w-3" aria-hidden="true" />
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[min(400px,60vh)] overflow-y-auto">
          {isLoading && <p role="status" className="p-6 text-center text-sm text-muted">Loading alerts…</p>}
          {error && (
            <div role="alert" className="p-4 text-sm">
              <p>Alerts could not be refreshed.</p>
              <button type="button" className="mt-2 text-primary underline" onClick={() => { void mutate(); }}>
                Try again
              </button>
            </div>
          )}
          {!isLoading && !error && unreadData.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">
              {notifications.length > 0 ? "All alerts marked as read." : "No current alerts from recorded data."}
            </p>
          )}
          {unreadData.map((item) => {
            const { Icon, color, label } = priorityConfig[item.priority];
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  markRead([item.id]);
                  setOpen(false);
                }}
                className="flex items-start gap-3 border-b border-border/60 px-4 py-3 hover:bg-surface-secondary"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold uppercase tracking-wide ${color}`}>{label} · Unread</p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <Link
          href="/alerts"
          onClick={() => setOpen(false)}
          className="block border-t border-border px-4 py-3 text-center text-sm font-medium text-primary hover:bg-surface-secondary"
        >
          Open Alert Center
        </Link>
      </PopoverContent>
    </Popover>
  );
}
