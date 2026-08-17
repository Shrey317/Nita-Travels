"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { RepairAnomaly } from "@/lib/db/transactions";

export function RepairsAnomalies({ anomalies }: { anomalies: RepairAnomaly[] }) {
  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 shadow-sm">
      <div className="flex gap-3">
        <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-orange-700 dark:text-orange-400">Repair Anomalies Detected</h3>
          <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
            The system has identified unusual repair patterns in the last 30 days:
          </p>
          <ul className="mt-3 space-y-2">
            {anomalies.map((anomaly, idx) => (
              <li key={`${anomaly.vehicleId}-${idx}`} className="text-sm text-orange-800 dark:text-orange-200">
                <Link href={`/vehicles/${anomaly.vehicleId}`} className="font-semibold hover:underline">
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
