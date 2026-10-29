"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { RepairAnomaly } from "@/lib/db/transactions";

export function RepairsAnomalies({ anomalies }: { anomalies: RepairAnomaly[] }) {
  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-xl border border-status-warning/20 bg-status-warning/5 p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-warning/10 border border-status-warning/20 shrink-0">
          <AlertTriangle className="h-4 w-4 text-status-warning" />
        </div>
        <div>
          <h3 className="font-bold text-status-warning">Repair Anomalies Detected</h3>
          <p className="text-sm text-ink-secondary mt-1">
            The system has identified unusual repair patterns in the last 30 days:
          </p>
          <ul className="mt-3 space-y-2">
            {anomalies.map((anomaly, idx) => (
              <li key={`${anomaly.vehicleId}-${idx}`} className="text-sm text-ink-secondary">
                <Link href={`/vehicles/${anomaly.vehicleId}`} className="font-bold text-status-warning hover:underline">
                  {anomaly.vehicleId}
                </Link>{" "}
                — {anomaly.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
