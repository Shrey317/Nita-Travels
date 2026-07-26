/**
 * lib/db/notes.ts
 *
 * All Prisma queries for vehicle notes. There is no update path (SRS 11: "delete and re-enter
 * only") — deliberately, so this file only exports list, create, and delete.
 */

import type { VehicleNote, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { NotFoundError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { vehicleNoteSchema, type VehicleNoteInput } from "@/lib/schemas/note.schema";

export interface NoteFilters {
  vehicleId?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface NoteListResult {
  items: VehicleNote[];
  total: number;
  page: number;
  limit: number;
}

export async function getNotes(filters: NoteFilters = {}): Promise<NoteListResult> {
  const { vehicleId, dateFrom, dateTo, page = 1, limit = DEFAULT_PAGE_SIZE } = filters;
  const where: Prisma.VehicleNoteWhereInput = {
    ...(vehicleId && vehicleId.length > 0 ? { vehicleId: { in: vehicleId } } : {}),
    ...(dateFrom || dateTo
      ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.vehicleNote.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.vehicleNote.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function createNote(input: VehicleNoteInput): Promise<VehicleNote> {
  const data = vehicleNoteSchema.parse(input);
  return prisma.vehicleNote.create({ data });
}

export async function deleteNote(id: string): Promise<void> {
  const existing = await prisma.vehicleNote.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError(`Note ${id} not found`);
  await prisma.vehicleNote.delete({ where: { id } });
}
