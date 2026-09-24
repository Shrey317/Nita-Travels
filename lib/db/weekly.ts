/**
 * lib/db/weekly.ts
 *
 * Weekly aggregation supporting variable date ranges, defaulting to full history.
 */

import { prisma } from "@/lib/db/client";
import { formatMargin } from "@/lib/format";
import { REPAIR_CATEGORIES } from "@/lib/constants";
import { startOfISOWeek, endOfISOWeek, addWeeks, format, getISOWeek, getISOWeekYear } from "date-fns";

export interface WeeklyRow {
  weekKey: string;
  weekLabel: string;
  weekNumber: number;
  isoYear: number;
  weekStart: string;
  weekEnd: string;
  incomeCents: number;
  expenseCents: number;
  repairsCents: number;
  netProfitCents: number;
  marginLabel: string;
  hasData: boolean;
}

function buildWeekBuckets(startDate: Date, endDate: Date): WeeklyRow[] {
  let currentWeekStart = startOfISOWeek(startDate);
  const end = endOfISOWeek(endDate);
  
  const buckets: WeeklyRow[] = [];
  while (currentWeekStart <= end) {
    const weekEnd = endOfISOWeek(currentWeekStart);
    const isoYear = getISOWeekYear(currentWeekStart);
    const weekNum = getISOWeek(currentWeekStart);
    const weekKey = `${isoYear}-W${weekNum.toString().padStart(2, '0')}`;
    const weekLabel = `W${weekNum.toString().padStart(2, '0')} ${isoYear}`;
    
    buckets.push({
      weekKey,
      weekLabel,
      weekNumber: weekNum,
      isoYear,
      weekStart: format(currentWeekStart, "dd MMM"),
      weekEnd: format(weekEnd, "dd MMM"),
      incomeCents: 0,
      expenseCents: 0,
      repairsCents: 0,
      netProfitCents: 0,
      marginLabel: "—",
      hasData: false,
    });
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }
  return buckets;
}

export async function getWeeklyBreakdown(dateFrom?: Date, dateTo?: Date): Promise<WeeklyRow[]> {
  // Determine bounds
  let actualFrom = dateFrom;
  let actualTo = dateTo;

  if (!actualFrom || !actualTo) {
    const result = await prisma.transaction.aggregate({
      _min: { date: true },
      _max: { date: true },
      where: { deletedAt: null },
    });
    if (!actualFrom) actualFrom = result._min.date ?? new Date(Date.UTC(2024, 0, 1));
    if (!actualTo) actualTo = result._max.date ?? new Date(Date.UTC(2026, 11, 31));
  }

  // Ensure reasonable fallback if still missing
  if (!actualFrom) actualFrom = new Date(Date.UTC(2024, 0, 1));
  if (!actualTo) actualTo = new Date(Date.UTC(2026, 11, 31));

  const buckets = buildWeekBuckets(actualFrom, actualTo);
  const bucketMap = new Map(buckets.map((b) => [b.weekKey, b]));

  const firstDate = startOfISOWeek(actualFrom);
  const lastDate = endOfISOWeek(actualTo);

  const transactions = await prisma.transaction.findMany({
    where: {
      deletedAt: null,
      date: {
        gte: firstDate,
        lte: lastDate,
      },
    },
    select: { date: true, category: true, incomeZarCents: true, expenseZarCents: true },
  });

  const repairCategories: readonly string[] = REPAIR_CATEGORIES;

  for (const t of transactions) {
    const tIsoYear = getISOWeekYear(t.date);
    const weekNum = getISOWeek(t.date);
    const weekKey = `${tIsoYear}-W${weekNum.toString().padStart(2, '0')}`;
    
    const bucket = bucketMap.get(weekKey);
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
