import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '@/lib/db/client';
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '@/lib/errors';
import { transactionUpdateSchema } from '@/lib/schemas/transaction.schema';
import { vehicleUpdateSchema } from '@/lib/schemas/vehicle.schema';
import { calendarDateSchema, positiveIntegerSchema } from '@/lib/schemas/common.schema';
import { documentSchema, workOrderSchema } from '@/lib/schemas/operations.schema';
import { updateTransaction, deleteTransaction } from '@/lib/db/transactions';
import { updateVehicle, deactivateVehicle } from '@/lib/db/vehicles';
import { updateMileageEntry, deleteMileageEntry } from '@/lib/db/mileage';
import { verifyNewAttachments } from '@/lib/verify-attachments';
import { z } from 'zod';

export const entitySchema = z.enum(['vehicle', 'transaction', 'mileage', 'note', 'document', 'workOrder']);
export type ChangeEntity = z.infer<typeof entitySchema>;
type Actor = { id: string; role: 'ADMIN' | 'MANAGER' };
export const mileageUpdateSchema = z.object({ currentMileageKm: positiveIntegerSchema, date: calendarDateSchema.optional() });
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

async function snapshot(tx: Prisma.TransactionClient, entity: ChangeEntity, id: string) {
  const row = entity === 'vehicle' ? await tx.vehicle.findUnique({ where: { id, deletedAt: null } })
    : entity === 'transaction' ? await tx.transaction.findUnique({ where: { id, deletedAt: null } })
    : entity === 'mileage' ? await tx.mileageEntry.findUnique({ where: { id } })
    : entity === 'note' ? await tx.vehicleNote.findUnique({ where: { id } })
    : entity === 'document' ? await tx.fleetDocument.findUnique({ where: { id, archived: false } })
    : await tx.workOrder.findUnique({ where: { id, archived: false } });
  if (!row) throw new NotFoundError('Record no longer exists.');
  return json(row);
}

async function lockRecord(tx: Prisma.TransactionClient, entity: ChangeEntity, id: string) {
  // Identifiers are selected from this fixed map, never submitted SQL.
  const tables = { vehicle: 'Vehicle', transaction: 'Transaction', mileage: 'MileageEntry', note: 'VehicleNote', document: 'FleetDocument', workOrder: 'WorkOrder' };
  if (entity === 'mileage') {
    const entry = await tx.mileageEntry.findUnique({ where: { id } });
    if (entry) await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${entry.vehicleId} FOR UPDATE`;
  }
  await tx.$queryRaw(Prisma.sql`SELECT id FROM ${Prisma.raw(`"${tables[entity]}"`)} WHERE id = ${id} FOR UPDATE`);
}

function validate(entity: ChangeEntity, operation: 'UPDATE' | 'DELETE', input: unknown) {
  if (operation === 'DELETE') return {};
  if (entity === 'note') throw new ValidationError('Notes cannot be edited.');
  return entity === 'vehicle' ? vehicleUpdateSchema.parse(input)
    : entity === 'transaction' ? transactionUpdateSchema.parse(input)
    : entity === 'mileage' ? mileageUpdateSchema.parse(input)
    : entity === 'document' ? documentSchema.parse(input) : workOrderSchema.parse(input);
}

async function apply(tx: Prisma.TransactionClient, entity: ChangeEntity, id: string, operation: 'UPDATE' | 'DELETE', input: unknown) {
  if (operation === 'DELETE') {
    if (entity === 'vehicle') return deactivateVehicle(id, tx);
    if (entity === 'transaction') return deleteTransaction(id, tx);
    if (entity === 'mileage') return deleteMileageEntry(id, tx);
    if (entity === 'note') return tx.vehicleNote.delete({ where: { id } });
    if (entity === 'document') return tx.fleetDocument.update({ where: { id }, data: { archived: true } });
    return tx.workOrder.update({ where: { id }, data: { archived: true } });
  }
  if (entity === 'vehicle') return updateVehicle(id, vehicleUpdateSchema.parse(input), tx);
  if (entity === 'transaction') return updateTransaction(id, transactionUpdateSchema.parse(input), tx);
  if (entity === 'mileage') return updateMileageEntry(id, mileageUpdateSchema.parse(input), tx);
  if (entity === 'document') {
    const data = documentSchema.parse(input);
    const existing = await tx.fleetDocument.findUniqueOrThrow({ where: { id } });
    await verifyNewAttachments(data.photoUrls, existing.photoUrls);
    await tx.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId, deletedAt: null } });
    return tx.fleetDocument.update({ where: { id }, data });
  }
  const data = workOrderSchema.parse(input);
  await tx.vehicle.findUniqueOrThrow({ where: { id: data.vehicleId, deletedAt: null } });
  return tx.workOrder.update({ where: { id }, data });
}

export async function changeRecord(actor: Actor, entity: ChangeEntity, id: string, operation: 'UPDATE' | 'DELETE', input: unknown = {}) {
  const proposed = json(validate(entity, operation, input));
  return prisma.$transaction(async tx => {
    await lockRecord(tx, entity, id);
    const before = await snapshot(tx, entity, id);
    if (actor.role === 'MANAGER') {
      const request = await tx.changeRequest.create({ data: { requestedBy: actor.id, entity, recordId: id, operation, before, proposed } });
      return { pendingApproval: true, requestId: request.id };
    }
    const result = await apply(tx, entity, id, operation, proposed);
    await tx.changeRequest.create({ data: { requestedBy: actor.id, entity, recordId: id, operation, before, proposed, status: 'APPROVED', reviewedBy: actor.id, reviewedAt: new Date() } });
    return { pendingApproval: false, result };
  }, TRANSACTION_OPTIONS);
}

export async function decideChange(actor: Actor, id: string, approve: boolean, note: string) {
  if (actor.role !== 'ADMIN') throw new UnauthorizedError('Administrator access required.');
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "ChangeRequest" WHERE id = ${id} FOR UPDATE`;
    const request = await tx.changeRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundError('Request not found.');
    if (request.status !== 'PENDING') throw new ConflictError('This request has already been reviewed.');
    if (approve) {
      const entity = entitySchema.parse(request.entity);
      await lockRecord(tx, entity, request.recordId);
      const current = await snapshot(tx, entity, request.recordId);
      if (canonical(current) !== canonical(request.before)) throw new ConflictError('The record changed after this request. Reject it and request a fresh correction.');
      await apply(tx, entity, request.recordId, z.enum(['UPDATE', 'DELETE']).parse(request.operation), request.proposed);
    }
    return tx.changeRequest.update({ where: { id }, data: { status: approve ? 'APPROVED' : 'REJECTED', reviewedBy: actor.id, reviewedAt: new Date(), reviewNote: note } });
  }, TRANSACTION_OPTIONS);
}
