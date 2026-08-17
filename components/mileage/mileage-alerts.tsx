"use client";

import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Vehicle } from "@prisma/client";

interface MileageAlertsProps {
  missingMileageVehicles: Vehicle[];
  overLimitVehicles: { vehicle: Vehicle; overBy: number }[];
}

export function MileageAlerts({ missingMileageVehicles, overLimitVehicles }: MileageAlertsProps) {
  if (missingMileageVehicles.length === 0 && overLimitVehicles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {missingMileageVehicles.length > 0 && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 flex gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-orange-700 dark:text-orange-400">Missing Mileage Logs</h3>
            <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
              The following active vehicles have no mileage logged in the last 7 days:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingMileageVehicles.map(v => (
                <Link key={v.id} href={`/mileage/new?vehicleId=${v.id}`} className="inline-flex items-center rounded-md bg-white/50 dark:bg-black/20 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                  {v.id}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {overLimitVehicles.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400">Recent Mileage Violations</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              The following vehicles exceeded their limit in the last 7 days:
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {overLimitVehicles.map(v => (
                <Link key={v.vehicle.id} href={`/vehicles/${v.vehicle.id}`} className="text-sm text-red-700 dark:text-red-400 hover:underline">
                  <span className="font-medium">{v.vehicle.id}</span> - {v.vehicle.registration} 
                  <span className="opacity-80 ml-1">(Over by {v.overBy.toLocaleString()} km)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
