import { Card } from "@/components/ui/card";
import { Bell, ChevronRight, ShieldAlert, Info, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { FleetNotification } from "@/lib/db/notifications";
import { cn } from "@/lib/utils";

export function AlertsPanel({ alerts }: { alerts: FleetNotification[] }) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityWeight = { critical: 3, warning: 2, info: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  return (
    <Card className="col-span-1 flex flex-col h-full bg-card border-border-subtle shadow-card-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle p-5 bg-gradient-to-r from-surface-elevated/50 to-transparent">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-error" />
          <h2 className="text-base font-semibold text-white tracking-tight">Active Alerts</h2>
        </div>
        <Link href="/alerts" className="text-xs font-medium text-muted hover:text-white">View all →</Link>
      </div>

      <div className="flex-1 flex flex-col divide-y divide-border-subtle overflow-y-auto max-h-[300px]">
        {sortedAlerts.slice(0, 5).map((a, i) => {
          const isError = a.priority === "critical";
          const isWarning = a.priority === "warning";
          
          return (
            <Link key={i} href={a.href} className="group flex items-start gap-4 px-5 py-4 hover:bg-surface-elevated/50 transition-colors">
              <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", 
                isError ? "bg-error/10 border-error/20 text-error" : 
                isWarning ? "bg-warning/10 border-warning/20 text-warning" : 
                "bg-info/10 border-info/20 text-info"
              )}>
                {isError ? <ShieldAlert className="h-4 w-4" /> : isWarning ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">{a.title}</span>
                  {a.vehicleId && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface border border-border-subtle text-muted">
                      {a.vehicleId}
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink-secondary mt-1 line-clamp-2 leading-relaxed">
                  {a.description}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors mt-2 shrink-0" />
            </Link>
          );
        })}
        {sortedAlerts.length === 0 && (
          <div className="p-6 flex flex-col items-center justify-center text-center h-full">
            <Bell className="h-8 w-8 text-muted mb-2 opacity-50" />
            <p className="text-sm text-muted">No active alerts. Fleet is healthy!</p>
          </div>
        )}
      </div>
    </Card>
  );
}
