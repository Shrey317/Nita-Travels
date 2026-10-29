"use client";

import { AlertTriangle, AlertCircle } from "lucide-react";
import Link from "next/link";
export interface MileageAlertVehicle {
  id: string;
  registration: string;
}

interface MileageAlertsProps {
  missingMileageVehicles: MileageAlertVehicle[];
  overLimitVehicles: { vehicle: MileageAlertVehicle; overBy: number }[];
}

export function MileageAlerts({ missingMileageVehicles, overLimitVehicles }: MileageAlertsProps) {
  if (missingMileageVehicles.length === 0 && overLimitVehicles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {missingMileageVehicles.length > 0 && (
        <div className="rounded-xl border border-status-warning/20 bg-status-warning/5 p-4 flex gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-status-warning">Missing Mileage Logs</h3>
            <p className="text-sm text-ink-secondary mt-1">
              The following active vehicles have no mileage logged during the current Monday–Sunday week:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingMileageVehicles.map(v => (
                <Link key={v.id} href={`/mileage/new?vehicleId=${v.id}`} className="inline-flex items-center rounded-lg bg-surface-elevated px-2.5 py-1 text-xs font-semibold text-status-warning border border-status-warning/20 hover:bg-status-warning/10 transition-colors">
                  {v.id}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {overLimitVehicles.length > 0 && (
        <div className="rounded-xl border border-status-error/20 bg-status-error/5 p-4 flex gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-status-error shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-status-error">Recent Mileage Violations</h3>
            <p className="text-sm text-ink-secondary mt-1">
              The following vehicles exceeded their limit during the current Monday–Sunday week:
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {overLimitVehicles.map(v => (
                <Link key={v.vehicle.id} href={`/vehicles/${v.vehicle.id}`} className="text-sm text-status-error hover:underline">
                  <span className="font-semibold">{v.vehicle.id}</span> - {v.vehicle.registration} 
                  <span className="ml-1">(Over by {v.overBy.toLocaleString()} km)</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
