/**
 * lib/db/analytics.ts
 *
 * Category breakdown and vehicle performance ranking (SRS 15.11). The ranking composes
 * getVehiclesWithFinancials() rather than re-deriving per-vehicle P&L — that calculation
 * already exists in lib/db/vehicles.ts and shouldn't be duplicated (SRS Section 5).
 */

import { prisma } from "@/lib/db/client";
import { getVehiclesWithFinancials } from "@/lib/db/vehicles";
import { calculateRoiPercent, calculateRevenuePerKm, calculateCostPerKm, calculateProfitPerKm } from "@/lib/finance";
import { buildPeriodAnalysis, explainProfitChange } from "@/lib/analytics";
import { addDays, dateKey, resolveAnalyticsSelection, type AnalyticsSearchParams } from "@/lib/date-ranges";
import { ValidationError } from "@/lib/errors";
import { checkVehicleReplacementCriteria } from "@/lib/health";
import { recordedOwnershipCost } from "@/lib/analytics";
import { businessToday } from "@/lib/date-ranges";
import { REPAIR_CATEGORIES } from "@/lib/constants";
import { isoWeekStart } from "@/lib/date-ranges";
import { formatMargin } from "@/lib/format";

export interface CategoryBreakdownRow {
  category: string;
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  /** null when total fleet expense is 0 — "% of total" is undefined, not 0, in that case. */
  percentOfTotalExpense: number | null;
  count: number;
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdownRow[]> {
  const groups = await prisma.transaction.groupBy({
    by: ["category"],
    where: { deletedAt: null },
    _sum: { incomeZarCents: true, expenseZarCents: true },
    _count: true,
  });

  const totalExpenseCents = groups.reduce((sum, g) => sum + (g._sum.expenseZarCents ?? 0), 0);

  return groups
    .map((g) => {
      const incomeCents = g._sum.incomeZarCents ?? 0;
      const expenseCents = g._sum.expenseZarCents ?? 0;
      return {
        category: g.category as string,
        incomeCents,
        expenseCents,
        netCents: incomeCents - expenseCents,
        percentOfTotalExpense: totalExpenseCents === 0 ? null : (expenseCents / totalExpenseCents) * 100,
        count: g._count,
      };
    })
    .sort((a, b) => b.expenseCents - a.expenseCents);
}

export interface VehicleRankingRow {
  rank: number;
  vehicleId: string;
  registration: string;
  incomeCents: number;
  expenseCents: number;
  repairsCents: number;
  netProfitCents: number;
  marginLabel: string;
  roiPercent: number | null;
  kmSincePurchase: number;
  revenuePerKmCents: number | null;
  costPerKmCents: number | null;
  profitPerKmCents: number | null;
}

/** Excludes ALLCR and no-vehicle entries by construction — getVehiclesWithFinancials() only
 *  ever returns real Vehicle rows (SRS 13.3). Sorted Net P/L descending. */
export async function getVehiclePerformanceRanking(): Promise<VehicleRankingRow[]> {
  const summaries = await getVehiclesWithFinancials();
  const sorted = [...summaries].sort((a, b) => b.netProfitCents - a.netProfitCents);

  return sorted.map((s, index) => ({
    rank: index + 1,
    vehicleId: s.vehicle.id,
    registration: s.vehicle.registration,
    incomeCents: s.incomeCents,
    expenseCents: s.expenseCents,
    repairsCents: s.repairsCents,
    netProfitCents: s.netProfitCents,
    marginLabel: s.marginLabel,
    roiPercent: calculateRoiPercent(s.netProfitCents, s.vehicle.purchasePriceCents),
    kmSincePurchase: s.kmSincePurchase,
    revenuePerKmCents: calculateRevenuePerKm(s.incomeCents, s.kmSincePurchase),
    costPerKmCents: calculateCostPerKm(s.expenseCents, s.kmSincePurchase),
    profitPerKmCents: calculateProfitPerKm(s.netProfitCents, s.kmSincePurchase),
  }));
}

/** One bounded projection per source, independent of vehicle count. No production mock data or stale global cache. */
export async function getAnalyticsReport(params: AnalyticsSearchParams = {}) {
  let historyRange;
  if (params.range === "all") {
    const where = params.vehicleId ? { vehicleId: params.vehicleId } : {};
    const [ledger, logs] = await Promise.all([
      prisma.transaction.aggregate({ where: { ...where, deletedAt: null }, _min: { date: true }, _max: { date: true } }),
      prisma.mileageEntry.aggregate({ where, _min: { date: true }, _max: { date: true } }),
    ]);
    const dates = [ledger._min.date, ledger._max.date, logs._min.date, logs._max.date].filter((date): date is Date => date !== null);
    historyRange = dates.length ? { from: new Date(Math.min(...dates.map(date => date.getTime()))), to: new Date(Math.max(...dates.map(date => date.getTime()))) } : undefined;
  }
  const selection = resolveAnalyticsSelection(params, new Date(), historyRange);
  const ranges = [selection.range, selection.comparisonRange].map(range => ({ date: { gte: range.from, lt: addDays(range.to, 1) } }));
  const mileageRanges = [selection.range, selection.comparisonRange].map(range => ({ date: { gte: addDays(isoWeekStart(range.from), -28), lt: addDays(range.to, 1) } }));
  const [vehicles, transactions, mileage] = await Promise.all([
    prisma.vehicle.findMany({ where: { deletedAt: null }, orderBy: { id: "asc" } }),
    prisma.transaction.findMany({
      where: { deletedAt: null, OR: ranges, ...(selection.vehicleId ? { vehicleId: selection.vehicleId } : {}) },
      select: { id: true, date: true, vehicleId: true, category: true, incomeZarCents: true, expenseZarCents: true, mileageKm: true },
    }),
    prisma.mileageEntry.findMany({
      where: { OR: mileageRanges, ...(selection.vehicleId ? { vehicleId: selection.vehicleId } : {}) },
      select: { id: true, date: true, vehicleId: true, distanceDrivenKm: true, previousMileageKm: true, currentMileageKm: true },
    }),
  ]);
  if (selection.vehicleId && !vehicles.some(vehicle => vehicle.id === selection.vehicleId)) throw new ValidationError("The selected vehicle is unavailable. Choose another vehicle.");
  const input = { transactions, mileage, vehicles, vehicleId: selection.vehicleId };
  const current = buildPeriodAnalysis({ ...input, range: selection.range });
  const previous = buildPeriodAnalysis({ ...input, range: selection.comparisonRange, scale: selection.comparisonScale });
  const sourceParams = new URLSearchParams({ dateFrom: dateKey(selection.range.from), dateTo: dateKey(selection.range.to) });
  if (selection.vehicleId) sourceParams.set("vehicleId", selection.vehicleId);
  return { selection, vehicles, current, previous, profitBridge: explainProfitChange(current.totals, previous.totals),
    sourceHref: `/transactions?${sourceParams}`, mileageHref: `/mileage?${sourceParams}` };
}
export type AnalyticsReport = Awaited<ReturnType<typeof getAnalyticsReport>>;

/** Preserve the original API keys while deriving their values from the same selected report. */
export function analyticsCompatibility(report: AnalyticsReport) {
  const categoryBreakdown: CategoryBreakdownRow[] = report.current.categories.map(row => ({ ...row, netCents: row.incomeCents - row.expenseCents,
    percentOfTotalExpense: report.current.totals.expenseCents === 0 ? null : row.expenseCents / report.current.totals.expenseCents * 100 }));
  const sourceVehicles = new Map(report.vehicles.map(vehicle => [vehicle.id, vehicle]));
  const vehicleRanking: VehicleRankingRow[] = [...report.current.vehicles].sort((a, b) => b.netProfitCents - a.netProfitCents).map((row, index) => ({ ...row,
    rank: index + 1, kmSincePurchase: (sourceVehicles.get(row.vehicleId)?.currentMileageKm ?? 0) - (sourceVehicles.get(row.vehicleId)?.mileageAtPurchaseKm ?? 0), marginLabel: formatMargin(row.incomeCents, row.expenseCents) }));
  const vehicleSummary = report.current.vehicles.map(row => ({ ...row, vehicle: sourceVehicles.get(row.vehicleId),
    kmSincePurchase: (sourceVehicles.get(row.vehicleId)?.currentMileageKm ?? 0) - (sourceVehicles.get(row.vehicleId)?.mileageAtPurchaseKm ?? 0), marginLabel: formatMargin(row.incomeCents, row.expenseCents) }));
  return { categoryBreakdown, vehicleRanking, vehicleSummary };
}

export async function getReplacementReview() {
  const [vehicles, transactions] = await Promise.all([
    getVehiclesWithFinancials(undefined, undefined, true),
    prisma.transaction.findMany({ where: { deletedAt: null, category: { in: [...REPAIR_CATEGORIES, "Service", "Maintenance"] } }, select: { id: true, vehicleId: true, category: true, date: true, incomeZarCents: true, expenseZarCents: true } }),
  ]);
  const today = businessToday();
  return vehicles.map(row => {
    const history = transactions.filter(item => item.vehicleId === row.vehicle.id && item.date <= today);
    const repairs = history.filter(item => (REPAIR_CATEGORIES as readonly string[]).includes(item.category));
    const recentRepairCents = repairs.filter(item => item.date >= addDays(today, -90)).reduce((sum, item) => sum + item.expenseZarCents, 0);
    const priorRepairCents = repairs.filter(item => item.date >= addDays(today, -180) && item.date < addDays(today, -90)).reduce((sum, item) => sum + item.expenseZarCents, 0);
    const maintenanceCents = history.reduce((sum, item) => sum + item.expenseZarCents, 0);
    const roiPercent = calculateRoiPercent(row.netProfitCents, row.vehicle.purchasePriceCents);
    const factors = checkVehicleReplacementCriteria({ currentMileageKm: row.vehicle.currentMileageKm, purchaseDate: row.vehicle.purchaseDate,
      roiPercent, repairsCostCents: row.repairsCents, totalIncomeCents: row.incomeCents,
      profitPerKmCents: calculateProfitPerKm(row.netProfitCents, row.kmSincePurchase) });
    return { ...row, roiPercent, factors: factors.reasons, repairCount: repairs.length, recentRepairCents, priorRepairCents,
      maintenancePerKmCents: calculateCostPerKm(maintenanceCents, row.kmSincePurchase),
      ageYears: Math.max(0, (today.getTime() - row.vehicle.purchaseDate.getTime()) / (365.25 * 86400000)),
      ownership: recordedOwnershipCost(row.vehicle.purchasePriceCents, row.incomeCents, row.expenseCents) };
  });
}
