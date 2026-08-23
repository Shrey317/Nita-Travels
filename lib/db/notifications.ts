/**
 * lib/db/notifications.ts
 *
 * Generates fleet notifications from real data. These are computed on demand (not stored),
 * so they always reflect current state. Each notification carries enough context to navigate
 * directly to the affected record.
 */

import { prisma } from "@/lib/db/client";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { differenceInCalendarDays } from "date-fns";

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

/**
 * Generates all current fleet notifications from real data.
 * Never fabricated — every notification maps to a verifiable data point.
 */
export async function getFleetNotifications(): Promise<FleetNotification[]> {
  const notifications: FleetNotification[] = [];
  const now = new Date();

  const [vehicles, serviceRows] = await Promise.all([
    prisma.vehicle.findMany({
      where: { active: true },
      select: {
        id: true,
        registration: true,
        make: true,
        model: true,
        insuranceEndDate: true,
        currentMileageKm: true,
      },
      orderBy: { id: "asc" },
    }),
    getServiceStatusAllVehicles(),
  ]);

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  // Service notifications
  for (const row of serviceRows) {
    const v = vehicleMap.get(row.vehicleId);
    const vehicleName = v ? `${v.make} ${v.model} (${row.vehicleId})` : row.vehicleId;
    
    if (row.status === "OVERDUE") {
      const overBy = row.kmRemaining !== null ? Math.abs(row.kmRemaining) : 0;
      notifications.push({
        id: `svc-overdue-${row.vehicleId}`,
        priority: "critical",
        title: `Service Overdue: ${vehicleName}`,
        description: overBy > 0
          ? `This vehicle has exceeded its service interval by ${overBy.toLocaleString("en-ZA")} km. Please schedule maintenance immediately to prevent mechanical damage.`
          : `This vehicle is overdue for its scheduled service. Please schedule maintenance immediately.`,
        vehicleId: row.vehicleId,
        href: `/vehicles/${row.vehicleId}`,
        category: "service",
        timestamp: now,
      });
    } else if (row.status === "DUE_SOON") {
      const remaining = row.kmRemaining ?? 0;
      notifications.push({
        id: `svc-due-${row.vehicleId}`,
        priority: "warning",
        title: `Service Due Soon: ${vehicleName}`,
        description: `Only ${remaining.toLocaleString("en-ZA")} km remaining until the next scheduled service interval.`,
        vehicleId: row.vehicleId,
        href: `/vehicles/${row.vehicleId}`,
        category: "service",
        timestamp: now,
      });
    }
  }

  // Insurance notifications
  for (const v of vehicles) {
    if (!v.insuranceEndDate) continue;
    const daysUntil = differenceInCalendarDays(v.insuranceEndDate, now);

    if (daysUntil < 0) {
      notifications.push({
        id: `ins-expired-${v.id}`,
        priority: "critical",
        title: `Insurance Expired: ${v.make} ${v.model} (${v.id})`,
        description: `The insurance policy for this vehicle expired ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} ago. Renew the policy immediately to maintain legal compliance.`,
        vehicleId: v.id,
        href: `/vehicles/${v.id}`,
        category: "insurance",
        timestamp: now,
      });
    } else if (daysUntil <= 30) {
      notifications.push({
        id: `ins-expiring-${v.id}`,
        priority: "warning",
        title: `Insurance Expiring: ${v.make} ${v.model} (${v.id})`,
        description: `The insurance policy for this vehicle will expire in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}. Please arrange renewal.`,
        vehicleId: v.id,
        href: `/vehicles/${v.id}`,
        category: "insurance",
        timestamp: now,
      });
    }
  }

  // Missing mileage notifications
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentMileageByVehicle = await prisma.mileageEntry.groupBy({
    by: ["vehicleId"],
    where: { date: { gte: weekAgo } },
  });
  const vehiclesWithMileage = new Set(recentMileageByVehicle.map((e) => e.vehicleId));

  for (const v of vehicles) {
    if (!vehiclesWithMileage.has(v.id)) {
      notifications.push({
        id: `mil-missing-${v.id}`,
        priority: "warning",
        title: `Missing Mileage: ${v.make} ${v.model} (${v.id})`,
        description: `No mileage readings have been recorded this week. Prompt the driver to submit an updated reading to keep service tracking accurate.`,
        vehicleId: v.id,
        href: "/mileage",
        category: "mileage",
        timestamp: now,
      });
    }
  }

  // Mileage violation notifications (most recent entry over limit)
  const recentOverLimit = await prisma.mileageEntry.findMany({
    where: {
      date: { gte: weekAgo },
      overLimitByKm: { gt: 0 },
    },
    distinct: ["vehicleId"],
    orderBy: { date: "desc" },
    select: { vehicleId: true, overLimitByKm: true },
  });

  for (const entry of recentOverLimit) {
    const v = vehicleMap.get(entry.vehicleId);
    const vehicleName = v ? `${v.make} ${v.model} (${entry.vehicleId})` : entry.vehicleId;
    notifications.push({
      id: `mil-over-${entry.vehicleId}`,
      priority: "warning",
      title: `Mileage Limit Exceeded: ${vehicleName}`,
      description: `This vehicle exceeded its allocated weekly mileage limit by ${(entry.overLimitByKm ?? 0).toLocaleString("en-ZA")} km. Review usage to prevent accelerated depreciation.`,
      vehicleId: entry.vehicleId,
      href: "/mileage",
      category: "mileage",
      timestamp: now,
    });
  }

  // Sort: critical first, then warning, then info
  const priorityOrder: Record<NotificationPriority, number> = { critical: 0, warning: 1, info: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return notifications;
}
