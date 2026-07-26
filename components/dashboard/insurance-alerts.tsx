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
    <div className="rounded-xl border border-status-yellow/30 bg-status-yellow/5 p-4" role="status">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-yellow" aria-hidden="true" />
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
