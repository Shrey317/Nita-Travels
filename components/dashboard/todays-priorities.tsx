import Link from "next/link";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PriorityItem {
  vehicleId: string;
  severity: "critical" | "warning";
  title: string;
  href: string;
}

export function TodaysPriorities({ items }: { items: PriorityItem[] }) {
  if (items.length === 0) {
    return (
      <Card className="animate-slide-up delay-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-teal to-teal-light" />
            Today&apos;s Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-status-green/20 bg-status-green/5 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-green/10">
              <Clock className="h-4 w-4 text-status-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">All clear</p>
              <p className="text-xs text-muted">No urgent items need attention today.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-slide-up delay-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-status-red to-orange-400" />
          Today&apos;s Priorities
          <span className="ml-auto inline-flex h-5 items-center rounded-full bg-status-red/10 px-2 text-xs font-medium text-status-red">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item, i) => {
            const isCritical = item.severity === "critical";
            return (
              <Link
                key={`${item.vehicleId}-${i}`}
                href={item.href}
                className="group flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-all hover:border-teal/30 hover:bg-surface/50 hover:shadow-sm"
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isCritical ? "bg-status-red/10" : "bg-status-yellow/10"
                }`}>
                  {isCritical ? (
                    <AlertCircle className="h-3.5 w-3.5 text-status-red" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-status-yellow" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.vehicleId}
                    </span>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${
                      isCritical ? "text-status-red" : "text-status-yellow"
                    }`}>
                      {isCritical ? "Critical" : "Warning"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink group-hover:text-teal transition-colors">{item.title}</p>
                </div>
                <span className="mt-1 text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
