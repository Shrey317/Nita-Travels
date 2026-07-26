/**
 * lib/db/monthly.ts
 *
 * Monthly aggregation across the fixed Jan 2024 - Dec 2026 range (SRS 13.9), including months
 * with zero activity. Prisma has no native "group by calendar month" operator, so this fetches
 * the (date, category, incomeZarCents, expenseZarCents) columns for transactions in range and
 * buckets them in JS — the same pragmatic, scale-appropriate choice made in lib/db/vehicles.ts's
 * Activity Timeline for the same reason: simpler to read and maintain than a raw-SQL date_trunc
 * query, at negligible cost for a single fleet's realistic transaction volume.
 */

import { prisma } from "@/lib/db/client";
import { formatMonthKey, formatMargin } from "@/lib/format";
import { REPAIR_CATEGORIES } from "@/lib/constants";

export interface MonthlyRow {
  monthKey: string; // "Jan-2024"
  year: number;
  monthIndex: number; // 0-11
  incomeCents: number;
  expenseCents: number;
  repairsCents: number;
  netProfitCents: number;
  marginLabel: string;
  hasData: boolean;
}

const RANGE_START_YEAR = 2024;
const RANGE_START_MONTH = 0; // January
const RANGE_END_YEAR = 2026;
const RANGE_END_MONTH = 11; // December

function bucketKey(year: number, monthIndex: number): string {
  return `${year}-${monthIndex}`;
}

function buildMonthBuckets(): MonthlyRow[] {
  const buckets: MonthlyRow[] = [];
  let year = RANGE_START_YEAR;
  let month = RANGE_START_MONTH;
  while (year < RANGE_END_YEAR || (year === RANGE_END_YEAR && month <= RANGE_END_MONTH)) {
    buckets.push({
      monthKey: formatMonthKey(new Date(Date.UTC(year, month, 1))),
      year,
      monthIndex: month,
      incomeCents: 0,
      expenseCents: 0,
      repairsCents: 0,
      netProfitCents: 0,
      marginLabel: "—",
      hasData: false,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return buckets;
}

/** Fleet-wide monthly totals — every vehicleId including ALLCR and null (SRS 13.9, same scope
 *  as the Dashboard KPIs, unlike per-vehicle views). */
export async function getMonthlyBreakdown(): Promise<MonthlyRow[]> {
  const buckets = buildMonthBuckets();
  const bucketMap = new Map(buckets.map((b) => [bucketKey(b.year, b.monthIndex), b]));

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: new Date(Date.UTC(RANGE_START_YEAR, RANGE_START_MONTH, 1)),
        lt: new Date(Date.UTC(RANGE_END_YEAR, RANGE_END_MONTH + 1, 1)),
      },
    },
    select: { date: true, category: true, incomeZarCents: true, expenseZarCents: true },
  });

  const repairCategories: readonly string[] = REPAIR_CATEGORIES;

  for (const t of transactions) {
    const bucket = bucketMap.get(bucketKey(t.date.getUTCFullYear(), t.date.getUTCMonth()));
    if (!bucket) continue; // outside the fixed range — the where clause already excludes this in practice
    bucket.incomeCents += t.incomeZarCents;
    bucket.expenseCents += t.expenseZarCents;
    if (repairCategories.includes(t.category)) bucket.repairsCents += t.expenseZarCents;
    bucket.hasData = true;
  }

  for (const bucket of buckets) {
    bucket.netProfitCents = bucket.incomeCents - bucket.expenseCents;
    bucket.marginLabel = formatMargin(bucket.incomeCents, bucket.expenseCents);
  }

  return buckets;
}
