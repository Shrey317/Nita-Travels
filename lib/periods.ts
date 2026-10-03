import { summarizeFinancialRows, type AnalyticsMileage, type AnalyticsTransaction } from "@/lib/analytics";
import { addDays, dateKey, isoWeekStart, type ClosedDateRange } from "@/lib/date-ranges";

export function isoWeekIdentity(date: Date) {
  const monday = isoWeekStart(date);
  const isoYear = addDays(monday, 3).getUTCFullYear();
  const first = isoWeekStart(new Date(Date.UTC(isoYear, 0, 4)));
  const weekNumber = Math.round((monday.getTime() - first.getTime()) / 604800000) + 1;
  return { isoYear, weekNumber, weekKey: `${isoYear}-W${String(weekNumber).padStart(2, "0")}` };
}

/** Buckets label full weeks/months; source rows are always clipped to the exact selected dates. */
export function aggregatePeriods(transactions: readonly AnalyticsTransaction[], mileage: readonly AnalyticsMileage[], range: ClosedDateRange, frequency: "week" | "month") {
  const keyOf = (date: Date) => frequency === "week" ? dateKey(isoWeekStart(date)) : dateKey(date).slice(0, 7);
  const txByPeriod = new Map<string, AnalyticsTransaction[]>();
  const kmByPeriod = new Map<string, number>();
  for (const row of transactions) {
    if (row.deletedAt || row.date < range.from || row.date >= addDays(range.to, 1)) continue;
    const key = keyOf(row.date);
    const bucket = txByPeriod.get(key) ?? [];
    bucket.push(row); txByPeriod.set(key, bucket);
  }
  for (const row of mileage) {
    if (row.date < range.from || row.date >= addDays(range.to, 1) || row.distanceDrivenKm < 0 || row.distanceDrivenKm !== row.currentMileageKm - row.previousMileageKm) continue;
    const key = keyOf(row.date);
    kmByPeriod.set(key, (kmByPeriod.get(key) ?? 0) + row.distanceDrivenKm);
  }
  let cursor = frequency === "week" ? isoWeekStart(range.from) : new Date(Date.UTC(range.from.getUTCFullYear(), range.from.getUTCMonth(), 1));
  const result = [];
  while (cursor <= range.to) {
    const key = keyOf(cursor);
    const next = frequency === "week" ? addDays(cursor, 7) : new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    const rows = txByPeriod.get(key) ?? [];
    const km = kmByPeriod.get(key) ?? 0;
    result.push({ key, from: new Date(cursor), to: addDays(next, -1), ...summarizeFinancialRows(rows, km), hasData: rows.length > 0 || km > 0 });
    cursor = next;
  }
  return result;
}
export function summarizePeriods(rows: readonly { incomeCents: number; expenseCents: number; repairsCents: number; mileageKm?: number; maintenanceCents?: number }[]) {
  const sums = rows.reduce<{ incomeCents: number; expenseCents: number; repairsCents: number; mileageKm: number; maintenanceCents: number }>((total, row) => ({ incomeCents: total.incomeCents + row.incomeCents, expenseCents: total.expenseCents + row.expenseCents, repairsCents: total.repairsCents + row.repairsCents, mileageKm: total.mileageKm + (row.mileageKm ?? 0), maintenanceCents: total.maintenanceCents + (row.maintenanceCents ?? 0) }), { incomeCents: 0, expenseCents: 0, repairsCents: 0, mileageKm: 0, maintenanceCents: 0 });
  return { ...sums, netProfitCents: sums.incomeCents - sums.expenseCents };
}
