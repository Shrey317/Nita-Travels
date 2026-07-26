/**
 * lib/db/service.ts
 *
 * All Prisma queries behind service-status computation. Pure derivation math lives in
 * lib/service.ts; this file's job is only to fetch the right rows and hand them over.
 */

import { prisma } from "@/lib/db/client";
import {
  deriveServiceStatus,
  estimateDaysToNext,
  SERVICE_STATUS_SORT_ORDER,
  type ServiceStatus,
} from "@/lib/service";
import { averageWeeklyKm } from "@/lib/mileage";

export interface VehicleServiceRow {
  vehicleId: string;
  registration: string;
  lastServiceDate: Date | null;
  lastServiceMileageKm: number | null;
  nextSvcKm: number | null;
  currentMileageKm: number;
  kmRemaining: number | null;
  status: ServiceStatus;
}

export interface VehicleServiceRowWithEstimate extends VehicleServiceRow {
  daysToNext: number | null;
}

/**
 * Latest qualifying service record per vehicle: category = Service AND mileageKm is not null
 * (SRS 13.1 step 1). `distinct` + `orderBy: date desc` gets exactly the newest row per vehicle
 * in a single query — no N+1 loop over the fleet.
 */
async function getLatestServiceByVehicle(): Promise<Map<string, { date: Date; mileageKm: number }>> {
  const rows = await prisma.transaction.findMany({
    where: {
      category: "Service",
      mileageKm: { not: null },
      vehicleId: { not: null },
    },
    orderBy: { date: "desc" },
    distinct: ["vehicleId"],
    select: { vehicleId: true, date: true, mileageKm: true },
  });

  const map = new Map<string, { date: Date; mileageKm: number }>();
  for (const row of rows) {
    // vehicleId and mileageKm are guaranteed non-null by the where clause above.
    map.set(row.vehicleId as string, { date: row.date, mileageKm: row.mileageKm as number });
  }
  return map;
}

/** Service status for every active vehicle, sorted OVERDUE -> DUE_SOON -> OK -> NEEDS_DATA (SRS 15.6). */
export async function getServiceStatusAllVehicles(): Promise<VehicleServiceRow[]> {
  const [vehicles, latestServiceMap] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true },
      select: { id: true, registration: true, currentMileageKm: true, serviceIntervalKm: true },
      orderBy: { id: "asc" },
    }),
    getLatestServiceByVehicle(),
  ]);

  const rows: VehicleServiceRow[] = vehicles.map((v) => {
    const latest = latestServiceMap.get(v.id) ?? null;
    const { nextSvcKm, kmRemaining, status } = deriveServiceStatus(
      latest?.mileageKm ?? null,
      v.serviceIntervalKm,
      v.currentMileageKm
    );
    return {
      vehicleId: v.id,
      registration: v.registration,
      lastServiceDate: latest?.date ?? null,
      lastServiceMileageKm: latest?.mileageKm ?? null,
      nextSvcKm,
      currentMileageKm: v.currentMileageKm,
      kmRemaining,
      status,
    };
  });

  return rows.sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);
}

/**
 * Same as above, plus the "Days to Next (est.)" column that's specific to the dedicated
 * /service page (SRS 15.6) — projected from each vehicle's last 8 mileage-log entries.
 */
export async function getServiceStatusWithEstimates(): Promise<VehicleServiceRowWithEstimate[]> {
  const baseRows = await getServiceStatusAllVehicles();

  const recentEntries = await prisma.mileageEntry.findMany({
    where: { vehicleId: { in: baseRows.map((r) => r.vehicleId) } },
    orderBy: { date: "desc" },
    select: { vehicleId: true, distanceDrivenKm: true },
  });

  const byVehicle = new Map<string, number[]>();
  for (const entry of recentEntries) {
    const list = byVehicle.get(entry.vehicleId) ?? [];
    if (list.length < 8) {
      list.push(entry.distanceDrivenKm);
      byVehicle.set(entry.vehicleId, list);
    }
  }

  return baseRows.map((row) => ({
    ...row,
    daysToNext: estimateDaysToNext(row.kmRemaining, averageWeeklyKm(byVehicle.get(row.vehicleId) ?? [])),
  }));
}

/** Latest service mileage for a single vehicle — used by the Vehicle Profile page. */
export async function getLatestServiceForVehicle(
  vehicleId: string
): Promise<{ date: Date; mileageKm: number } | null> {
  const row = await prisma.transaction.findFirst({
    where: { vehicleId, category: "Service", mileageKm: { not: null } },
    orderBy: { date: "desc" },
    select: { date: true, mileageKm: true },
  });
  return row ? { date: row.date, mileageKm: row.mileageKm as number } : null;
}
