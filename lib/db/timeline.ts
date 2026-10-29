import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { TimelineFilters, TimelineItem, TimelineResult } from "@/lib/db/vehicles";

/** Parameterized UNION preserves fleet notes while paginating before transferring records. */
export async function queryVehicleTimeline(vehicleId: string, filters: TimelineFilters): Promise<TimelineResult> {
  const { page = 1, limit = 50, dateFrom, dateTo, type = "all" } = filters;
  const dates = Prisma.sql`${dateFrom ? Prisma.sql`AND date >= ${dateFrom}` : Prisma.empty} ${dateTo ? Prisma.sql`AND date <= ${dateTo}` : Prisma.empty}`;
  const source = Prisma.sql`
    SELECT id, date, category::text AS type, "incomeZarCents" AS "incomeCents", "expenseZarCents" AS "expenseCents",
      COALESCE(notes, '') AS details, false AS "isNote", "mileageKm", "photoUrls"
    FROM "Transaction" WHERE "vehicleId" = ${vehicleId} AND "deletedAt" IS NULL AND ${type !== "notes"} ${dates}
    UNION ALL
    SELECT id, date, 'Note', NULL::integer, NULL::integer, note, true, NULL::integer, "photoUrls"
    FROM "VehicleNote" WHERE "vehicleId" IN (${vehicleId}, 'ALLCR') AND ${type !== "transactions"} ${dates}`;
  const [items, counts] = await Promise.all([
    prisma.$queryRaw<TimelineItem[]>`SELECT * FROM (${source}) AS history ORDER BY date DESC, id ASC, "isNote" ASC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
    prisma.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*) AS total FROM (${source}) AS history`,
  ]);
  return { items, total: Number(counts[0]?.total ?? 0), page, limit };
}
