import Link from "next/link";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PriorityItem {
  vehicleId: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description?: string;
  href: string;
}

export function TodaysPriorities({ items }: { items: PriorityItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <span className="inline-block h-5 w-1 rounded-full bg-brand-blue" />
            Today&apos;s Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-status-success/20 bg-status-success/5 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-status-success/10">
              <CheckCircle2 className="h-4 w-4 text-status-success" />
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-5 w-1 rounded-full bg-status-error" />
          Today&apos;s Priorities
          <span className="ml-auto inline-flex h-5 items-center rounded-full bg-status-error/10 px-2 text-xs font-medium text-status-error">
            {items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.slice(0, 3).map((item, i) => {
            const isCritical = item.severity === "critical";
            return (
              <Link
                key={`${item.vehicleId}-${i}`}
                href={item.href}
                className="group flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-all hover:border-brand-blue/30 hover:bg-surface-secondary/50 hover:shadow-sm"
              >
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  isCritical ? "bg-status-error/10" : "bg-status-warning/10"
                }`}>
                  {isCritical ? (
                    <AlertCircle className="h-3.5 w-3.5 text-status-error" />
                  ) : (
                    item.severity === "info" ? <Info className="h-3.5 w-3.5 text-brand-blue" /> : <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded bg-brand-navy px-1.5 py-0.5 text-xs font-semibold text-white">
                      {item.vehicleId}
                    </span>
                    <span className={`text-xs font-medium ${
                      isCritical ? "text-status-error" : "text-status-warning"
                    }`}>
                      {isCritical ? "Critical" : item.severity === "info" ? "Information" : "Warning"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink group-hover:text-brand-blue transition-colors">{item.title}</p>
                  {item.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>}
                </div>
              </Link>
            );
          })}
        </div>
        <Link href="/alerts" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand-blue hover:underline">View all {items.length} alerts →</Link>
      </CardContent>
    </Card>
  );
}
