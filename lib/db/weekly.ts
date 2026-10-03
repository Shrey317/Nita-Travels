/** Weekly aggregation keeps ISO labels while clipping records to the exact selected dates. */
import { prisma } from "@/lib/db/client";
import { formatDate, formatMargin } from "@/lib/format";
import { businessToday, dateKey, parseCalendarDate } from "@/lib/date-ranges";
import { getPeriodBreakdown } from "@/lib/db/periods";
import { isoWeekIdentity } from "@/lib/periods";

export interface WeeklyRow {
  weekKey: string; weekLabel: string; weekNumber: number; isoYear: number;
  weekStart: string; weekEnd: string; incomeCents: number; expenseCents: number;
  repairsCents: number; netProfitCents: number; marginLabel: string; hasData: boolean;
  mileageKm: number; maintenanceCents: number;
}
export async function getWeeklyBreakdown(dateFrom?: Date, dateTo?: Date, vehicleId?: string): Promise<WeeklyRow[]> {
  let from = dateFrom, to = dateTo;
  if (!from || !to) {
    const [transactions, mileage] = await Promise.all([
      prisma.transaction.aggregate({ where: { deletedAt: null, ...(vehicleId ? { vehicleId } : {}) }, _min: { date: true }, _max: { date: true } }),
      prisma.mileageEntry.aggregate({ where: vehicleId ? { vehicleId } : {}, _min: { date: true }, _max: { date: true } }),
    ]);
    const dates = [transactions._min.date, transactions._max.date, mileage._min.date, mileage._max.date].filter((date): date is Date => date !== null);
    from ??= dates.length ? new Date(Math.min(...dates.map(date => date.getTime()))) : businessToday();
    to ??= dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : businessToday();
  }
  const rows = await getPeriodBreakdown({ from: parseCalendarDate(dateKey(from)), to: parseCalendarDate(dateKey(to)) }, "week", vehicleId);
  return rows.map(row => {
    const identity = isoWeekIdentity(row.from);
    return { ...identity, weekLabel: `W${String(identity.weekNumber).padStart(2, "0")} ${identity.isoYear}`,
      weekStart: formatDate(row.from), weekEnd: formatDate(row.to), incomeCents: row.incomeCents,
      expenseCents: row.expenseCents, repairsCents: row.repairsCents, netProfitCents: row.netProfitCents,
      marginLabel: formatMargin(row.incomeCents, row.expenseCents), hasData: row.hasData,
      mileageKm: row.mileageKm, maintenanceCents: row.maintenanceCents };
  });
}
