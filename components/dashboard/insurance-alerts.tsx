import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { computeInsuranceExpiryStatus } from "@/lib/alerts";
import { formatDate } from "@/lib/format";
import type { Vehicle } from "@prisma/client";

/** Renders nothing when every vehicle's insurance is current — this is meant to surface a
 *  problem, not to add permanent visual noise to a dashboard that's otherwise clean. */
export function InsuranceAlerts({ vehicles }: { vehicles: Vehicle[] }) {
  const flagged = vehicles
    .map((vehicle) => ({ vehicle, status: computeInsuranceExpiryStatus(vehicle.insuranceEndDate) }))
    .filter(({ status }) => status === "EXPIRED" || status === "EXPIRING_SOON");

  if (flagged.length === 0) return null;

  return (
    <div className="animate-slide-up relative overflow-hidden rounded-xl border border-status-yellow/20 bg-gradient-to-r from-status-yellow/5 to-transparent p-4" role="status">
      {/* Left accent gradient */}
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-to-b from-status-yellow to-status-yellow/40" />
      <div className="flex items-start gap-3 pl-2">
        <div className="relative mt-0.5 shrink-0">
          <AlertTriangle className="h-5 w-5 text-status-yellow" aria-hidden="true" />
          {/* Pulsing dot */}
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse-dot rounded-full bg-status-yellow" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-ink">Insurance needs attention</p>
          <ul className="space-y-0.5 text-sm text-muted">
            {flagged.map(({ vehicle, status }) => (
              <li key={vehicle.id}>
                <Link href={`/vehicles/${vehicle.id}`} className="font-medium text-teal hover:underline">
                  {vehicle.id}
                </Link>{" "}
                — {status === "EXPIRED" ? "insurance expired" : "insurance expiring soon"}
                {vehicle.insuranceEndDate ? ` (${formatDate(vehicle.insuranceEndDate)})` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
