/**
 * lib/db/monthly.ts
 *
 * Monthly aggregation filtered by calendar year.
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

function bucketKey(year: number, monthIndex: number): string {
  return `${year}-${monthIndex}`;
}

function buildMonthBuckets(year: number): MonthlyRow[] {
  const buckets: MonthlyRow[] = [];
  for (let month = 0; month < 12; month++) {
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
  }
  return buckets;
}

/** Fleet-wide monthly totals — every vehicleId including ALLCR and null. */
export async function getMonthlyBreakdown(year: number): Promise<MonthlyRow[]> {
  const buckets = buildMonthBuckets(year);
  const bucketMap = new Map(buckets.map((b) => [bucketKey(b.year, b.monthIndex), b]));

  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      date: {
        gte: new Date(Date.UTC(year, 0, 1)),
        lt: new Date(Date.UTC(year + 1, 0, 1)),
      },
    },
    select: { date: true, category: true, incomeZarCents: true, expenseZarCents: true },
  });

  const repairCategories: readonly string[] = REPAIR_CATEGORIES;

  for (const t of transactions) {
    const bucket = bucketMap.get(bucketKey(t.date.getUTCFullYear(), t.date.getUTCMonth()));
    if (!bucket) continue;
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

export async function getAvailableYears(): Promise<number[]> {
  const result = await prisma.transaction.aggregate({
    _min: { date: true },
    _max: { date: true },
    where: { deletedAt: null },
  });

  const currentYear = new Date().getFullYear();
  let minYear = result._min.date ? result._min.date.getUTCFullYear() : currentYear;
  let maxYear = result._max.date ? result._max.date.getUTCFullYear() : currentYear;

  if (currentYear < minYear) minYear = currentYear;
  if (currentYear > maxYear) maxYear = currentYear;

  const years: number[] = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }
  return years;
}
