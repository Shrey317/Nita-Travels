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
import { buildMileageEntry, isValidMileageProgression } from "@/lib/mileage";
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
  const previousMileageKm = await getPreviousMileage(data.vehicleId);

  if (!isValidMileageProgression(data.currentMileageKm, previousMileageKm)) {
    throw new ValidationError(
      `Current mileage (${data.currentMileageKm.toLocaleString()} km) must be greater than the last recorded reading (${previousMileageKm.toLocaleString()} km)`,
      "currentMileageKm"
    );
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

    // Same "only ever move forward" sync rule as Service transactions (SRS 15.8).
    const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId } });
    if (data.currentMileageKm > vehicle.currentMileageKm) {
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { currentMileageKm: data.currentMileageKm } });
    }

    return created;
  }, TRANSACTION_OPTIONS);
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

  if (!isValidMileageProgression(newCurrentKm, existing.previousMileageKm)) {
    throw new ValidationError(
      `Current mileage (${newCurrentKm.toLocaleString()} km) must be greater than the previous reading (${existing.previousMileageKm.toLocaleString()} km)`,
      "currentMileageKm"
    );
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

    // Re-sync the vehicle's currentMileageKm: find the highest reading across all entries.
    const maxEntry = await tx.mileageEntry.findFirst({
      where: { vehicleId: existing.vehicleId },
      orderBy: { currentMileageKm: "desc" },
      select: { currentMileageKm: true },
    });
    if (maxEntry) {
      const vehicle = await tx.vehicle.findUniqueOrThrow({ where: { id: existing.vehicleId } });
      const highestKm = Math.max(maxEntry.currentMileageKm, vehicle.currentMileageKm);
      if (highestKm !== vehicle.currentMileageKm) {
        await tx.vehicle.update({ where: { id: existing.vehicleId }, data: { currentMileageKm: highestKm } });
      }
    }

    return updated;
  }, TRANSACTION_OPTIONS);
}

export async function deleteMileageEntry(id: string): Promise<void> {
  const existing = await prisma.mileageEntry.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Mileage entry ${id} not found`);
  await prisma.mileageEntry.delete({ where: { id } });
}