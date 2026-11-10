/** Shared operational alerts. Every item links to recorded evidence. */
import { prisma } from "@/lib/db/client";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { analyzeMileage } from "@/lib/analytics";
import { WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";
import { addDays, businessToday, dateKey, isoWeekStart } from "@/lib/date-ranges";

export type NotificationPriority = "critical" | "warning" | "info";
export interface FleetNotification {
  id: string;
  priority: NotificationPriority;
  title: string;
  description: string;
  vehicleId: string | null;
  href: string;
  category: "service" | "insurance" | "mileage" | "repairs" | "documents";
  timestamp: Date;
}

/** Fresh reads keep notifications consistent after mutations, including non-React callers. */
export async function getFleetNotifications(serviceRead?: ReturnType<typeof getServiceStatusAllVehicles>): Promise<FleetNotification[]> {
  const today = businessToday();
  const weekStart = isoWeekStart(today);
  const [vehicles, serviceRows, mileageEntries] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true, deletedAt: null },
      select: { id: true, registration: true, make: true, model: true, currentMileageKm: true },
      orderBy: { id: "asc" },
    }),
    serviceRead ?? getServiceStatusAllVehicles(),
    prisma.mileageEntry.findMany({
      where: { date: { gte: weekStart, lt: addDays(today, 1) }, vehicle: { active: true, deletedAt: null } },
      select: { id: true, vehicleId: true, date: true, previousMileageKm: true, currentMileageKm: true, distanceDrivenKm: true },
    }),
  ]);
  const notifications: FleetNotification[] = [];
  const [documents, plannedWork] = await Promise.all([
    prisma.fleetDocument.findMany({ where: { archived: false, expiryDate: { lte: addDays(today, 30) } }, select: { id: true, vehicleId: true, title: true, expiryDate: true } }),
    prisma.workOrder.findMany({ where: { archived: false, completedDate: null }, select: { id: true, vehicleId: true, title: true, plannedDate: true, startedDate: true, kind: true, targetMileageKm: true } }),
  ]);
  for (const document of documents) notifications.push({ id: `doc-${document.id}`, priority: document.expiryDate < today ? 'critical' : 'warning', title: `${document.vehicleId} · Document renewal`, description: `${document.title} expires ${dateKey(document.expiryDate)}.`, vehicleId: document.vehicleId, href: `/documents?vehicleId=${document.vehicleId}#${document.id}`, category: 'documents', timestamp: today });
  for (const work of plannedWork) {
    const vehicle = vehicles.find(row => row.id === work.vehicleId);
    const mileageDue = work.targetMileageKm !== null && !!vehicle && vehicle.currentMileageKm >= work.targetMileageKm;
    if (!work.startedDate && work.plannedDate > addDays(today, 7) && !mileageDue) continue;
    notifications.push({ id: `work-${work.id}`, priority: (work.plannedDate < today || mileageDue) && !work.startedDate ? 'warning' : 'info', title: `${work.vehicleId} · ${work.startedDate ? 'Work in progress' : 'Planned work'}`, description: `${work.title}, planned ${dateKey(work.plannedDate)}.${mileageDue ? ' Target odometer reached.' : ''}`, vehicleId: work.vehicleId, href: `/work-orders?vehicleId=${work.vehicleId}#${work.id}`, category: work.kind === 'SERVICE' ? 'service' : 'repairs', timestamp: today });
  }
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
