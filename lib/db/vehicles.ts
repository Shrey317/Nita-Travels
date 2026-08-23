/**
 * lib/db/vehicles.ts
 *
 * All Prisma queries for vehicles: fleet summaries, single-vehicle detail, the merged
 * activity timeline, and CRUD. Financial aggregation and service-status derivation are
 * composed from lib/format.ts and lib/db/service.ts rather than recomputed here.
 */

import type { Vehicle } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { getServiceStatusAllVehicles, getLatestServiceForVehicle, type VehicleServiceRow } from "@/lib/db/service";
import { deriveServiceStatus } from "@/lib/service";
import { formatMargin } from "@/lib/format";
import { NotFoundError } from "@/lib/errors";
import { REPAIR_CATEGORIES } from "@/lib/constants";
import {
  vehicleSchema,
  vehicleUpdateSchema,
  type VehicleInput,
  type VehicleUpdateInput,
} from "@/lib/schemas/vehicle.schema";

export interface VehicleSummary {
  vehicle: Vehicle;
  incomeCents: number;
  expenseCents: number;
  repairsCents: number;
  netProfitCents: number;
  marginLabel: string;
  service: VehicleServiceRow | null;
  kmSincePurchase: number;
}

/**
 * Every active vehicle with income/expense/repairs/net-P&L/margin and service status —
 * powers both the Dashboard's per-vehicle table and the /vehicles card grid. Three queries
 * total regardless of fleet size (financials, repairs subset, service status), not one per
 * vehicle.
 */
export async function getVehiclesWithFinancials(dateFrom?: Date, dateTo?: Date, includeInactive?: boolean): Promise<VehicleSummary[]> {
  const vehicles = await prisma.vehicle.findMany({ where: includeInactive ? undefined : { active: true }, orderBy: { id: "asc" } });
  const vehicleIds = vehicles.map((v) => v.id);

  const dateWhere = dateFrom || dateTo
    ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
    : {};

  const [incomeExpenseGroups, repairsGroups, serviceRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["vehicleId"],
      where: { vehicleId: { in: vehicleIds }, ...dateWhere },
      _sum: { incomeZarCents: true, expenseZarCents: true },
    }),
    prisma.transaction.groupBy({
      by: ["vehicleId"],
      where: { vehicleId: { in: vehicleIds }, category: { in: [...REPAIR_CATEGORIES] }, ...dateWhere },
      _sum: { expenseZarCents: true },
    }),
    getServiceStatusAllVehicles(),
  ]);

  const incomeExpenseMap = new Map(incomeExpenseGroups.map((g) => [g.vehicleId as string, g._sum]));
  const repairsMap = new Map(repairsGroups.map((g) => [g.vehicleId as string, g._sum.expenseZarCents ?? 0]));
  const serviceMap = new Map(serviceRows.map((r) => [r.vehicleId, r]));

  return vehicles.map((vehicle) => {
    const incomeCents = incomeExpenseMap.get(vehicle.id)?.incomeZarCents ?? 0;
    const expenseCents = incomeExpenseMap.get(vehicle.id)?.expenseZarCents ?? 0;
    return {
      vehicle,
      incomeCents,
      expenseCents,
      repairsCents: repairsMap.get(vehicle.id) ?? 0,
      netProfitCents: incomeCents - expenseCents,
      marginLabel: formatMargin(incomeCents, expenseCents),
      service: serviceMap.get(vehicle.id) ?? null,
      kmSincePurchase: vehicle.currentMileageKm - vehicle.mileageAtPurchaseKm,
    };
  });
}

export interface VehicleDetail extends VehicleSummary {
  emiBalanceCents: number;
  roiPercent: number | null;
}

/** Full detail for the Vehicle Profile page (SRS 15.3). Not filtered by `active` — a
 *  deactivated vehicle's profile must stay viewable even though it drops off the main list. */
export async function getVehicleDetail(id: string): Promise<VehicleDetail | null> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) return null;

  const [incomeExpense, repairs, latestService] = await Promise.all([
    prisma.transaction.aggregate({
      where: { vehicleId: id },
      _sum: { incomeZarCents: true, expenseZarCents: true },
    }),
    prisma.transaction.aggregate({
      where: { vehicleId: id, category: { in: [...REPAIR_CATEGORIES] } },
      _sum: { expenseZarCents: true },
    }),
    getLatestServiceForVehicle(id),
  ]);

  const incomeCents = incomeExpense._sum.incomeZarCents ?? 0;
  const expenseCents = incomeExpense._sum.expenseZarCents ?? 0;
  const netProfitCents = incomeCents - expenseCents;

  const { nextSvcKm, kmRemaining, status } = deriveServiceStatus(
    latestService?.mileageKm ?? null,
    vehicle.serviceIntervalKm,
    vehicle.currentMileageKm
  );

  return {
    vehicle,
    incomeCents,
    expenseCents,
    repairsCents: repairs._sum.expenseZarCents ?? 0,
    netProfitCents,
    marginLabel: formatMargin(incomeCents, expenseCents),
    emiBalanceCents: vehicle.targetEmiCents * (vehicle.emiMonthsTotal - vehicle.emiMonthsPaid),
    roiPercent: vehicle.purchasePriceCents === 0 ? null : (netProfitCents / vehicle.purchasePriceCents) * 100,
    kmSincePurchase: vehicle.currentMileageKm - vehicle.mileageAtPurchaseKm,
    service: {
      vehicleId: vehicle.id,
      registration: vehicle.registration,
      lastServiceDate: latestService?.date ?? null,
      lastServiceMileageKm: latestService?.mileageKm ?? null,
      nextSvcKm,
      currentMileageKm: vehicle.currentMileageKm,
      kmRemaining,
      status,
    },
  };
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const data = vehicleSchema.parse(input);
  return prisma.vehicle.create({ data });
}

/** Merges the PATCH body onto the existing row, then validates the complete result — so a
 *  business rule (like emiMonthsPaid <= emiMonthsTotal) can't be bypassed by editing one field
 *  at a time while leaving the other stale. */
export async function updateVehicle(id: string, input: VehicleUpdateInput): Promise<Vehicle> {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Vehicle ${id} not found`);

  const partial = vehicleUpdateSchema.parse(input);
  const merged = vehicleSchema.parse({ ...existing, ...partial, id: existing.id });
  return prisma.vehicle.update({ where: { id }, data: merged });
}

/** DELETE /api/vehicles/[id] is a soft-deactivate (SRS 16, 26) — vehicles are never hard-deleted
 *  so historical transactions/mileage/notes referencing them stay intact and queryable. */
export async function deactivateVehicle(id: string): Promise<Vehicle> {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Vehicle ${id} not found`);
  return prisma.vehicle.update({ where: { id }, data: { active: false } });
}

export interface TimelineItem {
  id: string;
  date: Date;
  type: string; // Category name, or "Note"
  incomeCents: number | null;
  expenseCents: number | null;
  details: string;
  isNote: boolean;
  mileageKm: number | null;
  photoUrls: string[];
}

export interface TimelineFilters {
  page?: number;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
  type?: "all" | "transactions" | "notes";
}

export interface TimelineResult {
  items: TimelineItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Merged Transaction + VehicleNote timeline for a vehicle (SRS 13.8), newest first, paginated
 * 50/page. Notes are included when addressed to this vehicle OR to the whole fleet ("ALLCR").
 *
 * Both source tables are fetched in full for this one vehicle and merged/sorted/paginated in
 * JS rather than via a SQL UNION. For a single vehicle's realistic lifetime volume (a fleet
 * this size logs, at most, low hundreds of rows per vehicle) that's simpler to read and
 * maintain than a raw-SQL union view, at negligible cost — see Section 2.7 of the spec's own
 * assumption policy. If a vehicle's history ever grew into the tens of thousands of rows,
 * this would be the first place to revisit with a real paginated UNION query.
 */
export async function getVehicleTimeline(vehicleId: string, filters: TimelineFilters = {}): Promise<TimelineResult> {
  const { page = 1, limit = 50, dateFrom, dateTo, type = "all" } = filters;
  const dateFilter =
    dateFrom || dateTo
      ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {};

  const [transactions, notes] = await Promise.all([
    type === "notes"
      ? Promise.resolve([])
      : prisma.transaction.findMany({ where: { vehicleId, ...dateFilter }, orderBy: { date: "desc" } }),
    type === "transactions"
      ? Promise.resolve([])
      : prisma.vehicleNote.findMany({
          where: { vehicleId: { in: [vehicleId, "ALLCR"] }, ...dateFilter },
          orderBy: { date: "desc" },
        }),
  ]);

  const items: TimelineItem[] = [
    ...transactions.map((t) => ({
      id: t.id,
      date: t.date,
      type: t.category as string,
      incomeCents: t.incomeZarCents,
      expenseCents: t.expenseZarCents,
      details: t.notes ?? "",
      isNote: false,
      mileageKm: t.mileageKm,
      photoUrls: t.photoUrls,
    })),
    ...notes.map((n) => ({
      id: n.id,
      date: n.date,
      type: "Note",
      incomeCents: null,
      expenseCents: null,
      details: n.note,
      isNote: true,
      mileageKm: null,
      photoUrls: n.photoUrls,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total: items.length, page, limit };
}

export interface MonthlyFinancials {
  month: string;
  incomeCents: number;
  expenseCents: number;
}

export async function getVehicleMonthlyFinancials(id: string): Promise<MonthlyFinancials[]> {
  const transactions = await prisma.transaction.findMany({
    where: { vehicleId: id },
    select: { date: true, incomeZarCents: true, expenseZarCents: true },
    orderBy: { date: "asc" },
  });

  const grouped = new Map<string, MonthlyFinancials>();
  for (const t of transactions) {
    const d = new Date(t.date.getFullYear(), t.date.getMonth(), 1);
    const key = d.getTime().toString();
    if (!grouped.has(key)) {
      grouped.set(key, { 
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), 
        incomeCents: 0, 
        expenseCents: 0 
      });
    }
    const data = grouped.get(key)!;
    data.incomeCents += t.incomeZarCents;
    data.expenseCents += t.expenseZarCents;
  }

  return Array.from(grouped.values());
}

export function calculateVehicleHealthScore(v: {
  active: boolean;
  serviceStatus?: "OK" | "DUE_SOON" | "OVERDUE" | "NEEDS_DATA";
  insuranceEndDate?: Date | null;
  hasRecentMileage?: boolean;
  ageInYears?: number;
  highRepairFrequency?: boolean;
}): { score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  if (!v.active) {
    return { score: 0, reasons: ["Vehicle is inactive"] };
  }

  if (v.serviceStatus === "OVERDUE") {
    score -= 25;
    reasons.push("Service is overdue (-25)");
  } else if (v.serviceStatus === "DUE_SOON") {
    score -= 10;
    reasons.push("Service is due soon (-10)");
  } else if (v.serviceStatus === "NEEDS_DATA") {
    score -= 5;
    reasons.push("Missing service records (-5)");
  }

  if (v.insuranceEndDate) {
    const today = new Date();
    const end = v.insuranceEndDate.getTime();
    if (end < today.getTime()) {
      score -= 25;
      reasons.push("Insurance is expired (-25)");
    } else if (end - today.getTime() < 30 * 24 * 60 * 60 * 1000) {
      score -= 10;
      reasons.push("Insurance expires soon (-10)");
    }
  } else {
    score -= 15;
    reasons.push("No insurance data (-15)");
  }

  if (v.hasRecentMileage === false) {
    score -= 15;
    reasons.push("Missing recent mileage log (-15)");
  }

  if (v.highRepairFrequency) {
    score -= 20;
    reasons.push("High frequency of recent repairs (-20)");
  }

  if (v.ageInYears !== undefined && v.ageInYears > 5) {
    score -= 10;
    reasons.push(`Vehicle is older than 5 years (-10)`);
  }

  return { score: Math.max(0, score), reasons };
}

export function checkVehicleReplacementCriteria(v: {
  currentMileageKm: number;
  purchaseDate: Date;
  roiPercent: number | null;
  repairsCostCents: number;
  totalIncomeCents: number;
}): { recommended: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  if (v.currentMileageKm > 300000) {
    reasons.push("Mileage exceeds 300,000 km.");
  }

  const ageInYears = (new Date().getTime() - v.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (ageInYears > 5) {
    reasons.push(`Vehicle age is over 5 years (${ageInYears.toFixed(1)} years).`);
  }

  if (v.totalIncomeCents > 0 && v.repairsCostCents > v.totalIncomeCents * 0.3) {
    reasons.push("Cumulative repair costs exceed 30% of total revenue.");
  }

  if (v.roiPercent !== null && v.roiPercent < -20 && ageInYears > 3) {
    reasons.push(`Persistently negative ROI (${v.roiPercent.toFixed(1)}%) on an older vehicle.`);
  }

  return {
    recommended: reasons.length >= 2,
    reasons
  };
}
