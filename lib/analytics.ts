/** Pure extensions of the shared finance engine. Input rows never leave the server. */
import { FLEET_WIDE_VEHICLE_ID, REPAIR_CATEGORIES } from "@/lib/constants";
import { financialMetrics, calculateRoiPercent, calculateCostPerKm } from "@/lib/finance";
import { addDays, calendarDays, dateKey, isoWeekStart, type ClosedDateRange } from "@/lib/date-ranges";
import { WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";

export interface AnalyticsTransaction {
  id: string; date: Date; vehicleId: string | null; category: string;
  incomeZarCents: number; expenseZarCents: number; mileageKm?: number | null; deletedAt?: Date | null;
}
export interface AnalyticsMileage {
  id: string; date: Date; vehicleId: string; distanceDrivenKm: number;
  previousMileageKm: number; currentMileageKm: number;
}
export interface AnalyticsVehicle {
  id: string; registration: string; active: boolean; purchasePriceCents: number;
  purchaseDate: Date; currentMileageKm: number; mileageAtPurchaseKm: number;
  insurer: string | null; policyNumber: string | null; insuranceEndDate: Date | null; warranty: string | null;
}
export interface CategoryMetric { category: string; incomeCents: number; expenseCents: number; count: number }
export interface DataIssue { id: string; vehicleId: string | null; title: string; evidence: string; href: string }
export interface RepairPattern {
  vehicleId: string; category: string; occurrences: number; previousDate: string; latestDate: string;
  totalCostCents: number; daysBetween: number;
}
const repairCategories: readonly string[] = REPAIR_CATEGORIES;
export const MAINTENANCE_CATEGORIES = [...REPAIR_CATEGORIES, "Service", "Maintenance"] as const;
/** Category-based classification; loan/insurance text in Other cannot be classified reliably. */
const FIXED_CATEGORIES: readonly string[] = ["License"];
const VARIABLE_CATEGORIES: readonly string[] = ["Fuel", "Tyres", "BrakePads", "Repairs", "Service", "Maintenance", "UberFees"];
const inRange = (date: Date, range: ClosedDateRange) => date >= range.from && date < addDays(range.to, 1);

export function summarizeFinancialRows(rows: readonly AnalyticsTransaction[], mileageKm = 0, scale = 1) {
  const categories = new Map<string, CategoryMetric>();
  for (const row of rows) {
    if (row.deletedAt) continue;
    const item = categories.get(row.category) ?? { category: row.category, incomeCents: 0, expenseCents: 0, count: 0 };
    item.incomeCents += row.incomeZarCents;
    item.expenseCents += row.expenseZarCents;
    item.count++;
    categories.set(row.category, item);
  }
  // Normalize category cents once so a rolling baseline and its profit bridge reconcile exactly.
  const categoryRows = [...categories.values()].map(row => ({ ...row,
    incomeCents: Math.round(row.incomeCents * scale), expenseCents: Math.round(row.expenseCents * scale) }));
  const sum = (keys?: readonly string[]) => categoryRows.filter(row => !keys || keys.includes(row.category)).reduce((n, row) => n + row.expenseCents, 0);
  const incomeCents = categoryRows.reduce((n, row) => n + row.incomeCents, 0);
  const expenseCents = sum();
  const maintenanceCents = sum(MAINTENANCE_CATEGORIES);
  const fixedCents = sum(FIXED_CATEGORIES);
  const variableCents = sum(VARIABLE_CATEGORIES);
  return {
    ...financialMetrics(incomeCents, expenseCents, mileageKm * scale),
    repairsCents: sum(REPAIR_CATEGORIES), serviceCents: sum(["Service"]), maintenanceCents,
    maintenancePerKmCents: calculateCostPerKm(maintenanceCents, mileageKm * scale),
    fixedCents, variableCents, unclassifiedCents: expenseCents - fixedCents - variableCents,
    transactionCount: rows.filter(row => !row.deletedAt).length, categories: categoryRows,
  };
}
export type FinancialSummary = ReturnType<typeof summarizeFinancialRows>;

/** Repeated categories are review evidence, never a diagnosis of the same mechanical fault. */
export function detectRepeatRepairs(rows: readonly AnalyticsTransaction[]): RepairPattern[] {
  const groups = new Map<string, AnalyticsTransaction[]>();
  for (const row of rows) {
    if (row.deletedAt || !row.vehicleId || row.vehicleId === FLEET_WIDE_VEHICLE_ID || !repairCategories.includes(row.category)) continue;
    const key = `${row.vehicleId}:${row.category}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].filter(group => group.length >= 2).map(group => {
    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
    const latest = sorted[sorted.length - 1]!;
    const previous = sorted[sorted.length - 2]!;
    return { vehicleId: latest.vehicleId!, category: latest.category, occurrences: sorted.length,
      previousDate: dateKey(previous.date), latestDate: dateKey(latest.date),
      totalCostCents: sorted.reduce((n, row) => n + row.expenseZarCents, 0),
      daysBetween: calendarDays({ from: previous.date, to: latest.date }) - 1 };
  }).sort((a, b) => b.occurrences - a.occurrences || b.totalCostCents - a.totalCostCents);
}

export function analyzeMileage(entries: readonly AnalyticsMileage[], range: ClosedDateRange) {
  const weeks = new Map<string, { vehicleId: string; week: string; km: number }>();
  const baselineWeeks = new Map<string, { vehicleId: string; week: string; km: number }>();
  const invalidEntries = entries.filter(row => row.distanceDrivenKm < 0 || row.currentMileageKm < row.previousMileageKm || row.distanceDrivenKm !== row.currentMileageKm - row.previousMileageKm);
  const invalidIds = new Set(invalidEntries.map(row => row.id));
  for (const row of entries) {
    if (row.date < addDays(isoWeekStart(range.from), -28) || row.date >= addDays(range.to, 1) || invalidIds.has(row.id)) continue;
    const week = dateKey(isoWeekStart(row.date));
    const key = `${row.vehicleId}:${week}`;
    const baseline = baselineWeeks.get(key) ?? { vehicleId: row.vehicleId, week, km: 0 };
    baseline.km += row.distanceDrivenKm;
    baselineWeeks.set(key, baseline);
    if (!inRange(row.date, range)) continue;
    const bucket = weeks.get(key) ?? { vehicleId: row.vehicleId, week, km: 0 };
    bucket.km += row.distanceDrivenKm;
    weeks.set(key, bucket);
  }
  const weekly = [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week));
  // Only complete Monday–Sunday buckets may be classified against a weekly limit or baseline.
  const complete = weekly.filter(row => new Date(row.week) >= range.from && addDays(new Date(row.week), 6) <= range.to);
  const anomalies: { vehicleId: string; week: string; km: number; averageKm: number; changePercent: number }[] = [];
  for (const row of complete) {
    const earlier = [...baselineWeeks.values()].filter(other => other.vehicleId === row.vehicleId && other.week < row.week).sort((a, b) => a.week.localeCompare(b.week)).slice(-4);
    if (earlier.length !== 4) continue;
    // Require four consecutive recorded weeks; missing logs cannot masquerade as zero usage.
    if (dateKey(addDays(new Date(earlier[0]!.week), 28)) !== row.week) continue;
    const averageKm = earlier.reduce((n, entry) => n + entry.km, 0) / 4;
    if (averageKm <= 0) continue;
    const changePercent = ((row.km - averageKm) / averageKm) * 100;
    if (Math.abs(changePercent) >= 50) anomalies.push({ ...row, averageKm, changePercent });
  }
  const violations = complete.filter(row => row.km > WEEKLY_MILEAGE_LIMIT);
  const totalKm = weekly.reduce((n, row) => n + row.km, 0);
  return { totalKm, weekly, violations, anomalies, invalidEntries: invalidEntries.filter(row => inRange(row.date, range)),
    averageKmPerDay: totalKm / calendarDays(range), averageKmPerWeek: totalKm / (calendarDays(range) / 7),
    highestWeeklyKm: complete.length ? Math.max(...complete.map(row => row.km)) : null,
    overLimitKm: violations.reduce((n, row) => n + row.km - WEEKLY_MILEAGE_LIMIT, 0) };
}

export function buildPeriodAnalysis(input: {
  transactions: readonly AnalyticsTransaction[]; mileage: readonly AnalyticsMileage[];
  vehicles: readonly AnalyticsVehicle[]; range: ClosedDateRange; vehicleId?: string; scale?: number;
}) {
  const { range, vehicleId, scale = 1 } = input;
  const transactions = input.transactions.filter(row => !row.deletedAt && inRange(row.date, range) && (!vehicleId || row.vehicleId === vehicleId));
  const mileageEntries = input.mileage.filter(row => inRange(row.date, range) && (!vehicleId || row.vehicleId === vehicleId));
  const vehicles = input.vehicles.filter(row => !vehicleId || row.id === vehicleId);
  const mileage = analyzeMileage(input.mileage.filter(row => !vehicleId || row.vehicleId === vehicleId), range);
  const totals = summarizeFinancialRows(transactions, mileage.totalKm, scale);
  const vehicleMetrics = vehicles.map(vehicle => {
    const rows = transactions.filter(row => row.vehicleId === vehicle.id);
    const km = mileage.weekly.filter(row => row.vehicleId === vehicle.id).reduce((n, row) => n + row.km, 0);
    const metrics = summarizeFinancialRows(rows, km, scale);
    return { vehicleId: vehicle.id, registration: vehicle.registration, active: vehicle.active, ...metrics,
      roiPercent: calculateRoiPercent(metrics.netProfitCents, vehicle.purchasePriceCents),
      revenueShare: totals.incomeCents === 0 ? null : metrics.incomeCents / totals.incomeCents };
  });
  const realIds = new Set(input.vehicles.map(vehicle => vehicle.id));
  const unallocated = summarizeFinancialRows(transactions.filter(row => !row.vehicleId || !realIds.has(row.vehicleId)), 0, scale);
  const dataIssues: DataIssue[] = [];
  for (const vehicle of vehicles) {
    const href = `/vehicles/${vehicle.id}/edit`;
    if (!vehicle.insurer || !vehicle.policyNumber || !vehicle.insuranceEndDate) dataIssues.push({ id: `insurance-${vehicle.id}`, vehicleId: vehicle.id, title: "Incomplete insurance information", evidence: "Insurer, policy number and expiry date are required for a complete insurance record.", href });
    if (!vehicle.warranty?.trim()) dataIssues.push({ id: `warranty-${vehicle.id}`, vehicleId: vehicle.id, title: "Warranty information not recorded", evidence: "Coverage is unknown. Confirm whether a warranty applies.", href });
    if (vehicle.currentMileageKm < vehicle.mileageAtPurchaseKm) dataIssues.push({ id: `odometer-${vehicle.id}`, vehicleId: vehicle.id, title: "Odometer below purchase reading", evidence: `${vehicle.currentMileageKm} km current; ${vehicle.mileageAtPurchaseKm} km at purchase.`, href });
    if (vehicle.active && !mileageEntries.some(row => row.vehicleId === vehicle.id)) dataIssues.push({ id: `mileage-${vehicle.id}`, vehicleId: vehicle.id, title: "No mileage recorded in selected period", evidence: `${dateKey(range.from)} to ${dateKey(range.to)}; per-km metrics unavailable.`, href: `/mileage/new?vehicleId=${vehicle.id}` });
  }
  for (const row of transactions) {
    if (row.vehicleId && row.vehicleId !== FLEET_WIDE_VEHICLE_ID && !realIds.has(row.vehicleId)) dataIssues.push({ id: `orphan-${row.id}`, vehicleId: row.vehicleId, title: "Transaction has no available vehicle record", evidence: `Transaction ${row.id} refers to ${row.vehicleId}. It remains included in ledger totals.`, href: `/transactions?txId=${row.id}` });
    if ((row.incomeZarCents > 0 && row.expenseZarCents > 0) || row.incomeZarCents < 0 || row.expenseZarCents < 0 || (row.category === "Service" && row.mileageKm == null)) dataIssues.push({ id: `transaction-${row.id}`, vehicleId: row.vehicleId, title: "Transaction requires review", evidence: "Check income/expense amounts and the mileage required for a service record.", href: `/transactions?txId=${row.id}` });
    const vehicle = vehicles.find(item => item.id === row.vehicleId);
    if (vehicle && row.date < vehicle.purchaseDate) dataIssues.push({ id: `date-${row.id}`, vehicleId: row.vehicleId, title: "Transaction precedes purchase date", evidence: `${dateKey(row.date)} transaction; ${dateKey(vehicle.purchaseDate)} purchase.`, href: `/transactions?txId=${row.id}` });
  }
  for (const row of mileage.invalidEntries) dataIssues.push({ id: `invalid-mileage-${row.id}`, vehicleId: row.vehicleId, title: "Inconsistent mileage record", evidence: `Stored distance ${row.distanceDrivenKm} km; odometer ${row.previousMileageKm} → ${row.currentMileageKm}. Excluded from mileage metrics.`, href: `/mileage?vehicleId=${row.vehicleId}` });
  const monthly: { month: string; incomeCents: number; expenseCents: number; netProfitCents: number; maintenanceCents: number; mileageKm: number }[] = [];
  for (let date = new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1)); date <= range.to; date = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))) {
    const month = dateKey(date).slice(0, 7);
    const km = mileageEntries.filter(row => dateKey(row.date).startsWith(month) && !mileage.invalidEntries.includes(row)).reduce((n, row) => n + row.distanceDrivenKm, 0);
    const metrics = summarizeFinancialRows(transactions.filter(row => dateKey(row.date).startsWith(month)), km);
    monthly.push({ month, incomeCents: metrics.incomeCents, expenseCents: metrics.expenseCents, netProfitCents: metrics.netProfitCents, maintenanceCents: metrics.maintenanceCents, mileageKm: km });
  }
  const repairRows = transactions.filter(row => repairCategories.includes(row.category));
  return { totals, categories: totals.categories, vehicles: vehicleMetrics, unallocated, mileage, monthly, dataIssues,
    repairPatterns: detectRepeatRepairs(transactions),
    maintenance: { repairCount: repairRows.length, serviceCount: transactions.filter(row => row.category === "Service").length,
      averageRepairCents: repairRows.length ? totals.repairsCents / repairRows.length : null },
    recordedVehicleCount: vehicleMetrics.filter(row => row.transactionCount > 0 || row.mileageKm > 0).length };
}
export type PeriodAnalytics = ReturnType<typeof buildPeriodAnalysis>;
export type VehicleMetric = PeriodAnalytics["vehicles"][number];

export function explainProfitChange(current: FinancialSummary, previous: FinancialSummary) {
  const categories = [...new Set([...current.categories, ...previous.categories].map(row => row.category))];
  const revenueChange = current.incomeCents - previous.incomeCents;
  const contributors = categories.map(category => {
    const currentCents = current.categories.find(row => row.category === category)?.expenseCents ?? 0;
    const previousCents = previous.categories.find(row => row.category === category)?.expenseCents ?? 0;
    return { category, currentCents, previousCents, profitImpactCents: previousCents - currentCents };
  }).filter(row => row.profitImpactCents !== 0).sort((a, b) => Math.abs(b.profitImpactCents) - Math.abs(a.profitImpactCents));
  return { revenueChange, contributors, profitChange: current.netProfitCents - previous.netProfitCents };
}

/** Recorded operating cost + purchase only; finance principal/premiums are not invented or double-counted. */
export function recordedOwnershipCost(purchasePriceCents: number, incomeCents: number, expenseCents: number) {
  const totalCostCents = purchasePriceCents + expenseCents;
  return { purchasePriceCents, recordedOperatingCents: expenseCents, totalCostCents, netContributionCents: incomeCents - totalCostCents };
}
