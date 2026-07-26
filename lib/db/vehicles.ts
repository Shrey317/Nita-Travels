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
}

/**
 * Every active vehicle with income/expense/repairs/net-P&L/margin and service status —
 * powers both the Dashboard's per-vehicle table and the /vehicles card grid. Three queries
 * total regardless of fleet size (financials, repairs subset, service status), not one per
 * vehicle.
 */
export async function getVehiclesWithFinancials(): Promise<VehicleSummary[]> {
  const vehicles = await prisma.vehicle.findMany({ where: { active: true }, orderBy: { id: "asc" } });
  const vehicleIds = vehicles.map((v) => v.id);

  const [incomeExpenseGroups, repairsGroups, serviceRows] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["vehicleId"],
      where: { vehicleId: { in: vehicleIds } },
      _sum: { incomeZarCents: true, expenseZarCents: true },
    }),
    prisma.transaction.groupBy({
      by: ["vehicleId"],
      where: { vehicleId: { in: vehicleIds }, category: { in: [...REPAIR_CATEGORIES] } },
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
    };
  });
}

export interface VehicleDetail extends VehicleSummary {
  emiBalanceCents: number;
  roiPercent: number | null;
  kmSincePurchase: number;
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
