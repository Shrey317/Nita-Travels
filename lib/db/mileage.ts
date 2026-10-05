/**
 * lib/db/mileage.ts
 *
 * All Prisma queries for mileage entries. The core rule (SRS 13.5) lives here: previousMileageKm
 * is never trusted from the client — it comes from the preceding chronological entry or
 * mileageAtPurchaseKm. Every mutation validates the complete chain under a vehicle row lock.
 */

import type { MileageEntry, Prisma } from "@prisma/client";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildMileageEntry, WEEKLY_MILEAGE_LIMIT } from "@/lib/mileage";
import { deriveMileageChain } from "@/lib/mileage-chain";
import { positiveIntegerSchema } from "@/lib/schemas/common.schema";
import { csvEscape } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { mileageEntrySchema, type MileageEntryInput } from "@/lib/schemas/mileage.schema";

export interface MileageFilters {
  vehicleId?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface MileageListResult {
  items: (MileageEntry & { vehicle: { registration: string } })[];
  total: number;
  page: number;
  limit: number;
}

export async function getMileageEntries(filters: MileageFilters = {}): Promise<MileageListResult> {
  const { vehicleId, dateFrom, dateTo, page = 1, limit = DEFAULT_PAGE_SIZE } = filters;
  const where: Prisma.MileageEntryWhereInput = {
    ...(vehicleId && vehicleId.length > 0 ? { vehicleId: { in: vehicleId } } : {}),
    ...(dateFrom || dateTo
      ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.mileageEntry.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      include: { vehicle: { select: { registration: true } } },
    }),
    prisma.mileageEntry.count({ where }),
  ]);

  return { items, total, page, limit };
}

/** Preview the preceding reading as of the entry date, falling back to purchase mileage. */
export async function getPreviousMileage(vehicleId: string, readingDate?: Date): Promise<number> {
  const [latestEntry, vehicle] = await Promise.all([
    prisma.mileageEntry.findFirst({
      where: { vehicleId, ...(readingDate ? { date: { lte: readingDate } } : {}) },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      select: { currentMileageKm: true },
    }),
    prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { mileageAtPurchaseKm: true } }),
  ]);
  if (!vehicle) throw new NotFoundError(`Vehicle ${vehicleId} not found`);
  
  // INTENDED RULE: Vehicle.mileageAtPurchaseKm is the fallback anchor when no earlier mileage record exists.
  return latestEntry?.currentMileageKm ?? vehicle.mileageAtPurchaseKm;
}

export async function createMileageEntry(input: MileageEntryInput): Promise<MileageEntry> {
  const data = mileageEntrySchema.parse(input);
  return prisma.$transaction(async (tx) => {
    const vehicle = await lockMileageVehicle(tx, data.vehicleId);
    if (!vehicle.active || vehicle.deletedAt) {
      throw new ValidationError("Cannot add mileage entries to a deactivated or deleted vehicle", "vehicleId");
    }
    const previousMileageKm = vehicle.mileageAtPurchaseKm;
    const derived = buildMileageEntry(data.date, data.currentMileageKm, previousMileageKm);
    const created = await tx.mileageEntry.create({
      data: {
        date: data.date,
        vehicleId: data.vehicleId,
        previousMileageKm,
        currentMileageKm: data.currentMileageKm,
        distanceDrivenKm: derived.distanceDrivenKm,
        isoWeek: derived.isoWeek,
        isoYear: derived.isoYear,
        weeklyLimitKm: WEEKLY_MILEAGE_LIMIT,
        overLimitByKm: derived.overLimitByKm,
        photoUrls: data.photoUrls,
      },
    });

    await recalculateMileageChain(tx, data.vehicleId, created.id);
    return tx.mileageEntry.findUniqueOrThrow({ where: { id: created.id } });
  }, TRANSACTION_OPTIONS);
}

/** Serialize mileage mutations for one vehicle, including reads used to validate neighbors. */
async function lockMileageVehicle(tx: Prisma.TransactionClient, vehicleId: string) {
  await tx.$queryRaw`SELECT "id" FROM "Vehicle" WHERE "id" = ${vehicleId} FOR UPDATE`;
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new NotFoundError(`Vehicle ${vehicleId} not found`);
  return vehicle;
}

/** Validate the entire history before persisting any chain corrections; throws roll back the write. */
export async function recalculateMileageChain(tx: Prisma.TransactionClient, vehicleId: string, changedId?: string, minimumCurrentMileage = 0): Promise<void> {
  const entries = await tx.mileageEntry.findMany({
    where: { vehicleId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }, { id: "asc" }]
  });

  if (entries.length > 0) {
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId }, select: { mileageAtPurchaseKm: true } });
    
    const reconciled = deriveMileageChain(entries, vehicle.mileageAtPurchaseKm, changedId);
    const originalById = new Map(entries.map((entry) => [entry.id, entry]));
    for (const entry of reconciled) {
      const original = originalById.get(entry.id);
      if (original?.previousMileageKm !== entry.previousMileageKm || original.distanceDrivenKm !== entry.distanceDrivenKm || original.overLimitByKm !== entry.overLimitByKm) {
        await tx.mileageEntry.update({
          where: { id: entry.id },
          data: {
            previousMileageKm: entry.previousMileageKm,
            distanceDrivenKm: entry.distanceDrivenKm,
            overLimitByKm: entry.overLimitByKm
          }
        });
      }
    }
  }

  // Finally, re-sync vehicle's currentMileageKm to the max of all MileageEntry and Transaction
  const [maxEntry, maxTx, vehicle] = await Promise.all([
    tx.mileageEntry.findFirst({ where: { vehicleId }, orderBy: { currentMileageKm: "desc" }, select: { currentMileageKm: true } }),
    tx.transaction.findFirst({ where: { vehicleId, mileageKm: { not: null }, deletedAt: null }, orderBy: { mileageKm: "desc" }, select: { mileageKm: true } }),
    tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } })
  ]);
  const highestKm = Math.max(
    minimumCurrentMileage,
    maxEntry?.currentMileageKm ?? 0,
    maxTx?.mileageKm ?? 0,
    vehicle.mileageAtPurchaseKm // Absolute floor
  );
  if (highestKm !== vehicle.currentMileageKm) {
    await tx.vehicle.update({ where: { id: vehicleId }, data: { currentMileageKm: highestKm } });
  }
}

export interface UpdateMileageInput {
  currentMileageKm: number;
}

export async function updateMileageEntry(id: string, input: UpdateMileageInput): Promise<MileageEntry> {
  const existing = await prisma.mileageEntry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Mileage entry ${id} not found`);

  const newCurrentKm = positiveIntegerSchema.parse(input.currentMileageKm);

  return prisma.$transaction(async (tx) => {
    await lockMileageVehicle(tx, existing.vehicleId);
    await tx.mileageEntry.update({
      where: { id },
      data: {
        currentMileageKm: newCurrentKm,
      },
    });

    await recalculateMileageChain(tx, existing.vehicleId, id);
    return tx.mileageEntry.findUniqueOrThrow({ where: { id } });
  }, TRANSACTION_OPTIONS);
}

export async function deleteMileageEntry(id: string): Promise<void> {
  const existing = await prisma.mileageEntry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Mileage entry ${id} not found`);
  
  await prisma.$transaction(async (tx) => {
    await lockMileageVehicle(tx, existing.vehicleId);
    await tx.mileageEntry.delete({ where: { id } });
    await recalculateMileageChain(tx, existing.vehicleId);
  }, TRANSACTION_OPTIONS);
}

const CSV_HEADER = ["Date", "Vehicle", "Previous Mileage", "Current Mileage", "Distance Driven", "Over Limit By", "Week", "Year"] as const;

export async function exportMileageToCsv(filters: Omit<MileageFilters, "page" | "limit"> = {}): Promise<string> {
  const { vehicleId, dateFrom, dateTo } = filters;
  const where: Prisma.MileageEntryWhereInput = {
    ...(vehicleId && vehicleId.length > 0 ? { vehicleId: { in: vehicleId } } : {}),
    ...(dateFrom || dateTo
      ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const rows = await prisma.mileageEntry.findMany({ where, orderBy: [{ date: "desc" }, { id: "asc" }] });

  const lines = [CSV_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      [
        formatDate(row.date),
        row.vehicleId,
        row.previousMileageKm.toString(),
        row.currentMileageKm.toString(),
        row.distanceDrivenKm.toString(),
        row.overLimitByKm ? row.overLimitByKm.toString() : "",
        row.isoWeek.toString(),
        row.isoYear.toString(),
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }
  return lines.join("\n");
}
