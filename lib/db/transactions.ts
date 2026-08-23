/**
 * lib/db/transactions.ts
 *
 * All Prisma queries for transactions: filtered/paginated listing, CRUD, fleet-wide totals
 * (SRS 13.3 — includes ALLCR and null vehicleIds, unlike per-vehicle views), the repairs-log
 * summary, and CSV export.
 */

import type { Prisma, Transaction, Category } from "@prisma/client";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db/client";
import { NotFoundError } from "@/lib/errors";
import { REPAIR_CATEGORIES, DEFAULT_PAGE_SIZE, NO_VEHICLE_FILTER_VALUE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import { formatDate, formatZAR, formatKm } from "@/lib/format";
import {
  transactionSchema,
  transactionUpdateSchema,
  type TransactionInput,
  type TransactionUpdateInput,
} from "@/lib/schemas/transaction.schema";

const SORTABLE_FIELDS = ["date", "vehicleId", "category", "incomeZarCents", "expenseZarCents", "mileageKm"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

function isSortableField(value: string): value is SortableField {
  return (SORTABLE_FIELDS as readonly string[]).includes(value);
}

export interface TransactionFilters {
  vehicleId?: string[]; // "CR01".."CR09" | "ALLCR" | NO_VEHICLE_FILTER_VALUE
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

function buildVehicleIdWhere(vehicleIds?: string[]): Prisma.TransactionWhereInput {
  if (!vehicleIds || vehicleIds.length === 0) return {};
  const hasNone = vehicleIds.includes(NO_VEHICLE_FILTER_VALUE);
  const literalIds = vehicleIds.filter((v) => v !== NO_VEHICLE_FILTER_VALUE);
  if (hasNone && literalIds.length > 0) return { OR: [{ vehicleId: { in: literalIds } }, { vehicleId: null }] };
  if (hasNone) return { vehicleId: null };
  return { vehicleId: { in: literalIds } };
}

function buildTransactionWhere(filters: TransactionFilters): Prisma.TransactionWhereInput {
  const { vehicleId, category, dateFrom, dateTo, search } = filters;
  return {
    ...buildVehicleIdWhere(vehicleId),
    ...(category && category.length > 0 ? { category: { in: category as Category[] } } : {}),
    ...(dateFrom || dateTo
      ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
    ...(search ? { notes: { contains: search, mode: "insensitive" as const } } : {}),
  };
}

export interface TransactionListResult {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<TransactionListResult> {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, sortDir = "desc" } = filters;
  const sortBy = filters.sortBy && isSortableField(filters.sortBy) ? filters.sortBy : "date";
  const where = buildTransactionWhere(filters);

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      // Secondary key keeps pagination stable when many rows share the same primary sort value
      // (e.g. several transactions on the same date) — without it, page boundaries could
      // reshuffle rows between requests.
      orderBy: [{ [sortBy]: sortDir }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  return prisma.transaction.findUnique({ where: { id } });
}

/**
 * If a Service transaction carries a mileageKm reading higher than the vehicle's stored
 * currentMileageKm, the vehicle record is bumped to match (SRS 15.5). Never moves it backwards —
 * an earlier, lower reading entered after a later one (e.g. correcting historical data) must not
 * regress the fleet's live mileage figure.
 */
async function syncVehicleMileageFromService(
  tx: Prisma.TransactionClient,
  vehicleId: string | null,
  category: string,
  mileageKm: number | null | undefined
): Promise<void> {
  if (category !== "Service" || mileageKm == null || !vehicleId || vehicleId === FLEET_WIDE_VEHICLE_ID) return;
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (vehicle && mileageKm > vehicle.currentMileageKm) {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { currentMileageKm: mileageKm } });
  }
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const data = transactionSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({ data });
    await syncVehicleMileageFromService(tx, data.vehicleId, data.category, data.mileageKm);
    return created;
  }, TRANSACTION_OPTIONS);
}

/** Merges the PATCH body onto the existing row, validates the complete result, then writes —
 *  see vehicles.schema's equivalent comment for why this matters for cross-field rules. */
export async function updateTransaction(id: string, input: TransactionUpdateInput): Promise<Transaction> {
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Transaction ${id} not found`);

  const partial = transactionUpdateSchema.parse(input);
  const merged = transactionSchema.parse({ ...existing, ...partial });

  return prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({ where: { id }, data: merged });
    await syncVehicleMileageFromService(tx, merged.vehicleId, merged.category, merged.mileageKm);
    return updated;
  }, TRANSACTION_OPTIONS);
}

export async function deleteTransaction(id: string): Promise<void> {
  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Transaction ${id} not found`);
  await prisma.transaction.delete({ where: { id } });
}

export interface FleetTotals {
  incomeCents: number;
  expenseCents: number;
  netProfitCents: number;
}

/** Dashboard KPI totals — every vehicleId including ALLCR and null (SRS 13.3, 15.1). */
export async function getFleetTotals(dateFrom?: Date, dateTo?: Date): Promise<FleetTotals> {
  const where = dateFrom || dateTo
    ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
    : {};
  const result = await prisma.transaction.aggregate({ where, _sum: { incomeZarCents: true, expenseZarCents: true } });
  const incomeCents = result._sum.incomeZarCents ?? 0;
  const expenseCents = result._sum.expenseZarCents ?? 0;
  return { incomeCents, expenseCents, netProfitCents: incomeCents - expenseCents };
}

export interface RepairsSummary {
  totalCostCents: number;
  totalEvents: number;
  mostRecent: { date: Date; vehicleId: string | null } | null;
}

/** Summary cards for /repairs (SRS 15.7). */
export async function getRepairsSummary(): Promise<RepairsSummary> {
  const [agg, mostRecent] = await Promise.all([
    prisma.transaction.aggregate({
      where: { category: { in: [...REPAIR_CATEGORIES] } },
      _sum: { expenseZarCents: true },
      _count: true,
    }),
    prisma.transaction.findFirst({
      where: { category: { in: [...REPAIR_CATEGORIES] } },
      orderBy: { date: "desc" },
      select: { date: true, vehicleId: true },
    }),
  ]);

  return {
    totalCostCents: agg._sum.expenseZarCents ?? 0,
    totalEvents: agg._count,
    mostRecent: mostRecent ? { date: mostRecent.date, vehicleId: mostRecent.vehicleId } : null,
  };
}

export interface RepairAnomaly {
  vehicleId: string;
  type: "HIGH_FREQUENCY" | "HIGH_COST";
  description: string;
}

export async function getRepairsAnomalies(): Promise<RepairAnomaly[]> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const recentRepairs = await prisma.transaction.findMany({
    where: { 
      category: { in: [...REPAIR_CATEGORIES] },
      date: { gte: thirtyDaysAgo },
      vehicleId: { not: null }
    }
  });

  const costByVehicle = new Map<string, number>();
  const countByVehicle = new Map<string, number>();
  let totalCost = 0;

  for (const r of recentRepairs) {
    if (!r.vehicleId || r.vehicleId === FLEET_WIDE_VEHICLE_ID) continue;
    
    const cost = r.expenseZarCents ?? 0;
    totalCost += cost;

    costByVehicle.set(r.vehicleId, (costByVehicle.get(r.vehicleId) || 0) + cost);
    countByVehicle.set(r.vehicleId, (countByVehicle.get(r.vehicleId) || 0) + 1);
  }

  const activeVehicles = Array.from(costByVehicle.keys()).length;
  const avgCost = activeVehicles > 0 ? totalCost / activeVehicles : 0;

  const anomalies: RepairAnomaly[] = [];

  for (const [vehicleId, count] of countByVehicle.entries()) {
    if (count > 2) {
      anomalies.push({
        vehicleId,
        type: "HIGH_FREQUENCY",
        description: `Had ${count} repairs within the last 30 days.`
      });
    }
  }

  for (const [vehicleId, cost] of costByVehicle.entries()) {
    if (avgCost > 0 && cost > avgCost * 2) { 
      anomalies.push({
        vehicleId,
        type: "HIGH_COST",
        description: `Repair spending (R${(cost / 100).toFixed(0)}) is more than double the fleet average (R${(avgCost / 100).toFixed(0)}).`
      });
    }
  }

  return anomalies;
}

const CSV_HEADER = ["Date", "Vehicle", "Category", "Income (R)", "Expense (R)", "Mileage (km)", "Notes"] as const;

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** CSV export of a filtered transaction set (SRS 16, GET /api/transactions/export) — no page
 *  limit, since an export is expected to return everything the filter matches. */
export async function exportTransactionsToCsv(filters: Omit<TransactionFilters, "page" | "limit"> = {}): Promise<string> {
  const where = buildTransactionWhere(filters);
  const rows = await prisma.transaction.findMany({ where, orderBy: { date: "desc" } });

  const lines = [CSV_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      [
        formatDate(row.date),
        row.vehicleId ?? "",
        row.category,
        row.incomeZarCents ? formatZAR(row.incomeZarCents) : "",
        row.expenseZarCents ? formatZAR(row.expenseZarCents) : "",
        row.category === "Service" ? formatKm(row.mileageKm) : "",
        row.notes ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }
  return lines.join("\n");
}