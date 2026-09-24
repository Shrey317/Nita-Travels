/**
 * lib/db/weekly.ts
 *
 * Weekly aggregation filtered by ISO year.
 */

import { prisma } from "@/lib/db/client";
import { formatMargin } from "@/lib/format";
import { REPAIR_CATEGORIES } from "@/lib/constants";
import { startOfISOWeek, endOfISOWeek, getISOWeeksInYear, addWeeks, format, getISOWeek, getISOWeekYear } from "date-fns";

export interface WeeklyRow {
  weekKey: string;
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

function buildWeekBuckets(isoYear: number): WeeklyRow[] {
  // ISO Year always starts with the week that contains Jan 4th.
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  let currentWeekStart = startOfISOWeek(jan4);
  const weeksInYear = getISOWeeksInYear(jan4);
  
  const buckets: WeeklyRow[] = [];
  for (let w = 1; w <= weeksInYear; w++) {
    const weekEnd = endOfISOWeek(currentWeekStart);
    const weekKey = `W${w.toString().padStart(2, '0')}-${isoYear}`;
    buckets.push({
      weekKey,
      weekNumber: w,
      isoYear,
      weekStart: format(currentWeekStart, "MMM d"),
      weekEnd: format(weekEnd, "MMM d"),
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

export async function getWeeklyBreakdown(isoYear: number): Promise<WeeklyRow[]> {
  const buckets = buildWeekBuckets(isoYear);
  const bucketMap = new Map(buckets.map((b) => [b.weekNumber, b]));

  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const weeksInYear = getISOWeeksInYear(jan4);
  const firstDate = startOfISOWeek(jan4);
  const lastDate = endOfISOWeek(addWeeks(firstDate, weeksInYear - 1));

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
    if (tIsoYear !== isoYear) continue; // safety check
    
    const weekNum = getISOWeek(t.date);
    const bucket = bucketMap.get(weekNum);
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
