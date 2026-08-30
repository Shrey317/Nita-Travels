/**
 * lib/db/mileage.ts
 *
 * All Prisma queries for mileage entries. The core rule (SRS 13.5) lives here: previousMileageKm
 * is never trusted from the client — it's always fetched server-side from the vehicle's most
 * recent entry (or its currentMileageKm baseline for a first-ever entry), and a new reading that
 * doesn't exceed it is rejected outright.
 */

import type { MileageEntry, Prisma } from "@prisma/client";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db/client";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { buildMileageEntry, validateMileageReading } from "@/lib/mileage";
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
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { vehicle: { select: { registration: true } } },
    }),
    prisma.mileageEntry.count({ where }),
  ]);

  return { items, total, page, limit };
}

/** The vehicle's most recent MileageEntry reading, or — for its first-ever entry, where none
 *  exists — its own currentMileageKm baseline (never 0; see lib/mileage.ts for why that matters). */
export async function getPreviousMileage(vehicleId: string): Promise<number> {
  const [latestEntry, vehicle] = await Promise.all([
    prisma.mileageEntry.findFirst({
      where: { vehicleId },
      orderBy: { date: "desc" },
      select: { currentMileageKm: true },
    }),
    prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { currentMileageKm: true } }),
  ]);
  if (!vehicle) throw new NotFoundError(`Vehicle ${vehicleId} not found`);
  return latestEntry?.currentMileageKm ?? vehicle.currentMileageKm;
}

export async function createMileageEntry(input: MileageEntryInput): Promise<MileageEntry> {
  const data = mileageEntrySchema.parse(input);

  // Task 2: Prevent new entries for soft-deleted/inactive vehicles
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new NotFoundError(`Vehicle ${data.vehicleId} not found`);
  if (!vehicle.active || vehicle.deletedAt) {
    throw new ValidationError("Cannot add mileage entries to a deactivated or deleted vehicle", "vehicleId");
  }

  const previousMileageKm = await getPreviousMileage(data.vehicleId);

  const errorMsg = validateMileageReading(data.currentMileageKm, previousMileageKm);
  if (errorMsg) {
    throw new ValidationError(errorMsg, "currentMileageKm");
  }

  const derived = buildMileageEntry(data.date, data.currentMileageKm, previousMileageKm);

  return prisma.$transaction(async (tx) => {
    const created = await tx.mileageEntry.create({
      data: {
        date: data.date,
        vehicleId: data.vehicleId,
        previousMileageKm,
        currentMileageKm: data.currentMileageKm,
        distanceDrivenKm: derived.distanceDrivenKm,
        isoWeek: derived.isoWeek,
        isoYear: derived.isoYear,
        overLimitByKm: derived.overLimitByKm,
        photoUrls: data.photoUrls,
      },
    });

    // Re-sync chain and max mileage (handles out-of-order inserts gracefully)
    await recalculateMileageChain(tx, data.vehicleId);

    return created;
  }, TRANSACTION_OPTIONS);
}

/** Recalculates the historical chain to bridge gaps after an edit, delete, or out-of-order insert. */
async function recalculateMileageChain(tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">, vehicleId: string): Promise<void> {
  const entries = await tx.mileageEntry.findMany({
    where: { vehicleId },
    orderBy: { date: "asc" }
  });

  if (entries.length > 0) {
    // The very first entry in the chain acts as the anchor.
    let prev = entries[0]!.previousMileageKm;
    for (const entry of entries) {
      if (entry.previousMileageKm !== prev) {
        const derived = buildMileageEntry(entry.date, entry.currentMileageKm, prev, entry.weeklyLimitKm);
        await tx.mileageEntry.update({
          where: { id: entry.id },
          data: {
            previousMileageKm: prev,
            distanceDrivenKm: derived.distanceDrivenKm,
            overLimitByKm: derived.overLimitByKm
          }
        });
      }
      prev = entry.currentMileageKm;
    }
  }

  // Finally, re-sync vehicle's currentMileageKm to the max of all MileageEntry and Transaction
  const [maxEntry, maxTx, vehicle] = await Promise.all([
    tx.mileageEntry.findFirst({ where: { vehicleId }, orderBy: { currentMileageKm: "desc" }, select: { currentMileageKm: true } }),
    tx.transaction.findFirst({ where: { vehicleId, mileageKm: { not: null }, deletedAt: null }, orderBy: { mileageKm: "desc" }, select: { mileageKm: true } }),
    tx.vehicle.findUniqueOrThrow({ where: { id: vehicleId } })
  ]);
  const highestKm = Math.max(
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

  const newCurrentKm = input.currentMileageKm;

  if (!Number.isInteger(newCurrentKm) || newCurrentKm <= 0) {
    throw new ValidationError("Current mileage must be a positive whole number", "currentMileageKm");
  }

  const errorMsg = validateMileageReading(newCurrentKm, existing.previousMileageKm);
  if (errorMsg) {
    throw new ValidationError(errorMsg, "currentMileageKm");
  }

  const derived = buildMileageEntry(existing.date, newCurrentKm, existing.previousMileageKm, existing.weeklyLimitKm);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.mileageEntry.update({
      where: { id },
      data: {
        currentMileageKm: newCurrentKm,
        distanceDrivenKm: derived.distanceDrivenKm,
        overLimitByKm: derived.overLimitByKm,
      },
    });

    // Re-sync the vehicle's chain and max mileage
    await recalculateMileageChain(tx, existing.vehicleId);

    return updated;
  }, TRANSACTION_OPTIONS);
}

export async function deleteMileageEntry(id: string): Promise<void> {
  const existing = await prisma.mileageEntry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Mileage entry ${id} not found`);
  
  await prisma.$transaction(async (tx) => {
    await tx.mileageEntry.delete({ where: { id } });
    await recalculateMileageChain(tx, existing.vehicleId);
  }, TRANSACTION_OPTIONS);
}