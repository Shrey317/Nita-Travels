/** Shared operational alerts. Every item links to recorded evidence. */
import { prisma } from "@/lib/db/client";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { computeInsuranceExpiryStatus } from "@/lib/alerts";
import { analyzeMileage } from "@/lib/analytics";
import { WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";
import { addDays, businessToday, calendarDays, dateKey, isoWeekStart } from "@/lib/date-ranges";

export type NotificationPriority = "critical" | "warning" | "info";
export interface FleetNotification {
  id: string;
  priority: NotificationPriority;
  title: string;
  description: string;
  vehicleId: string | null;
  href: string;
  category: "service" | "insurance" | "mileage" | "repairs";
  timestamp: Date;
}

/** Fresh reads keep notifications consistent after mutations, including non-React callers. */
export async function getFleetNotifications(serviceRead?: ReturnType<typeof getServiceStatusAllVehicles>): Promise<FleetNotification[]> {
  const today = businessToday();
  const weekStart = isoWeekStart(today);
  const [vehicles, serviceRows, mileageEntries] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, registration: true, make: true, model: true, insuranceEndDate: true },
      orderBy: { id: "asc" },
    }),
    serviceRead ?? getServiceStatusAllVehicles(),
    prisma.mileageEntry.findMany({
      where: { date: { gte: weekStart, lt: addDays(today, 1) }, vehicle: { active: true, deletedAt: null } },
      select: { id: true, vehicleId: true, date: true, previousMileageKm: true, currentMileageKm: true, distanceDrivenKm: true },
    }),
  ]);
  const notifications: FleetNotification[] = [];
  const vehicleMap = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
  const base = { timestamp: today };
  for (const row of serviceRows) {
    if (!vehicleMap.has(row.vehicleId)) continue;
    if (row.status === "OVERDUE" || row.status === "DUE_SOON") {
      const overdue = row.status === "OVERDUE";
      notifications.push({ ...base, id: `${overdue ? "svc-overdue" : "svc-due"}-${row.vehicleId}`,
        priority: overdue ? "critical" : "warning", title: `${row.vehicleId} · Service ${overdue ? "overdue" : "due soon"}`,
        description: row.kmRemaining === null ? "Review the recorded service interval and odometer." : `${Math.abs(row.kmRemaining).toLocaleString("en-ZA")} km ${overdue ? "beyond" : "remaining until"} the next service interval. Review service history and arrange maintenance.`,
        vehicleId: row.vehicleId, href: `/vehicles/${row.vehicleId}#vehicle-maintenance`, category: "service" });
    } else if (row.status === "NEEDS_DATA") {
      notifications.push({ ...base, id: `svc-data-${row.vehicleId}`, priority: "info", title: `${row.vehicleId} · Service baseline missing`,
        description: "No service transaction with a mileage reading is available. Record or verify the latest service before interpreting service status.",
        vehicleId: row.vehicleId, href: `/transactions/new?vehicleId=${row.vehicleId}`, category: "service" });
    }
  }
  for (const vehicle of vehicles) {
    const status = computeInsuranceExpiryStatus(vehicle.insuranceEndDate, today);
    if ((status !== "EXPIRED" && status !== "EXPIRING_SOON") || !vehicle.insuranceEndDate) continue;
    const days = status === "EXPIRED"
      ? calendarDays({ from: vehicle.insuranceEndDate, to: today }) - 1
      : calendarDays({ from: today, to: vehicle.insuranceEndDate }) - 1;
    notifications.push({ ...base, id: `${status === "EXPIRED" ? "ins-expired" : "ins-expiring"}-${vehicle.id}`,
      priority: status === "EXPIRED" ? "critical" : "warning", title: `${vehicle.id} · Insurance ${status === "EXPIRED" ? "expired" : "expiring"}`,
      description: `Recorded expiry ${dateKey(vehicle.insuranceEndDate)} (${days} days ${status === "EXPIRED" ? "ago" : "remaining"}). Confirm coverage and update the renewal record.`,
      vehicleId: vehicle.id, href: `/vehicles/${vehicle.id}`, category: "insurance" });
  }
  const mileage = analyzeMileage(mileageEntries, { from: weekStart, to: addDays(weekStart, 6) });
  const recordedIds = new Set(mileageEntries.map(entry => entry.vehicleId));
  for (const vehicle of vehicles) {
    if (!recordedIds.has(vehicle.id)) notifications.push({ ...base, id: `mil-missing-${vehicle.id}`, priority: "warning",
      title: `${vehicle.id} · Mileage not logged this week`, description: `No reading dated ${dateKey(weekStart)} through ${dateKey(today)}. Record an odometer reading to keep distance and service tracking current.`,
      vehicleId: vehicle.id, href: `/mileage/new?vehicleId=${vehicle.id}`, category: "mileage" });
  }
  for (const week of mileage.violations) {
    notifications.push({ ...base, id: `mil-over-${week.vehicleId}`, priority: "warning", title: `${week.vehicleId} · Weekly mileage limit exceeded`,
      description: `${week.km.toLocaleString("en-ZA")} km recorded this week; limit ${WEEKLY_MILEAGE_LIMIT.toLocaleString("en-ZA")} km. Review the dated readings; distance between readings is attributed to the later reading.`,
      vehicleId: week.vehicleId, href: `/mileage?vehicleId=${week.vehicleId}&dateFrom=${dateKey(weekStart)}&dateTo=${dateKey(today)}`, category: "mileage" });
  }
  for (const entry of mileage.invalidEntries) notifications.push({ ...base, id: `mil-invalid-${entry.id}`, priority: "warning",
    title: `${entry.vehicleId} · Inconsistent mileage reading`, description: `Recorded distance ${entry.distanceDrivenKm} km does not match a valid progression from ${entry.previousMileageKm} to ${entry.currentMileageKm} km. Excluded from distance metrics.`,
    vehicleId: entry.vehicleId, href: `/mileage?vehicleId=${entry.vehicleId}`, category: "mileage" });
  const priorityOrder: Record<NotificationPriority, number> = { critical: 0, warning: 1, info: 2 };
  return notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.id.localeCompare(b.id));
}
