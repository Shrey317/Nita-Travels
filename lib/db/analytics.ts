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
