import { Card } from "@/components/ui/card";
import { Wrench, ChevronRight, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import type { VehicleServiceRow } from "@/lib/db/service";
import { formatDistanceToNow } from "date-fns";

export function UpcomingServices({ services }: { services: VehicleServiceRow[] }) {
  // Filter for 'attention' or 'warning' or sort by kmRemaining
  const sortedServices = [...services].sort((a, b) => {
    const aRem = a.kmRemaining ?? Infinity;
    const bRem = b.kmRemaining ?? Infinity;
    // Overdue first
    if (aRem < 0 && bRem >= 0) return -1;
    if (bRem < 0 && aRem >= 0) return 1;
    return aRem - bRem;
  }).slice(0, 5);

  return (
    <Card className="col-span-1 flex flex-col h-full bg-card border-border-subtle shadow-card-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle p-5 bg-gradient-to-r from-surface-elevated/50 to-transparent">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-white tracking-tight">Services & Maintenance</h2>
        </div>
        <Link href="/service" className="text-xs font-medium text-muted hover:text-white">View all →</Link>
      </div>

      <div className="flex-1 flex flex-col divide-y divide-border-subtle overflow-y-auto max-h-[300px]">
        {sortedServices.map(s => {
          const isOverdue = s.kmRemaining !== null && s.kmRemaining < 0;
          const isWarning = s.kmRemaining !== null && s.kmRemaining >= 0 && s.kmRemaining < 1500;
          
          return (
            <Link key={s.vehicleId} href={`/service?vehicleId=${s.vehicleId}`} className="group flex items-center justify-between px-5 py-4 hover:bg-surface-elevated/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
                  isOverdue ? 'bg-error/10 border-error/20 text-error' : 
                  isWarning ? 'bg-warning/10 border-warning/20 text-warning' : 
                  'bg-surface border-border-subtle text-muted group-hover:text-primary'
                }`}>
                  {isOverdue ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{s.vehicleId}</span>
                  <span className="text-[11px] text-muted">
                    Last service: {s.lastServiceDate ? formatDistanceToNow(s.lastServiceDate, { addSuffix: true }) : 'Never'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-mono-figures font-bold ${
                    isOverdue ? 'text-error' : 
                    isWarning ? 'text-warning' : 
                    'text-status-success'
                  }`}>
                    {s.kmRemaining === null 
                      ? 'No data' 
                      : isOverdue 
                        ? `${Math.abs(s.kmRemaining).toLocaleString()} km overdue` 
                        : `${s.kmRemaining.toLocaleString()} km left`}
                  </span>
                  <span className="text-[11px] text-muted">
                    {s.nextSvcKm === null ? 'Unknown' : `Due at ${s.nextSvcKm.toLocaleString()} km`}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              </div>
            </Link>
          );
        })}
        {sortedServices.length === 0 && (
          <div className="p-6 flex flex-col items-center justify-center text-center h-full">
            <Wrench className="h-8 w-8 text-muted mb-2 opacity-50" />
            <p className="text-sm text-muted">No services tracked yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
