import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { ConflictError, NotFoundError, ValidationError } from '../errors';
import { transferSchema } from '../schemas/rto.schema';

export async function audit(tx: Prisma.TransactionClient, scope: string, recordId: string, action: string, actor: string, detail: Prisma.InputJsonValue) {
  await tx.fleetAuditEvent.create({ data: { scope, recordId, action, actor, detail } });
}
export async function lockVehicle(tx: Prisma.TransactionClient, vehicleId: string) {
  await tx.$queryRaw`SELECT id FROM "Vehicle" WHERE id = ${vehicleId} FOR UPDATE`;
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId, deletedAt: null } });
  if (!vehicle) throw new NotFoundError('Vehicle not found.');
  return vehicle;
}
export async function assertRentalDate(tx: Prisma.TransactionClient, vehicleId: string | null, date: Date) {
  if (!vehicleId || vehicleId === 'ALLCR') return;
  await lockVehicle(tx, vehicleId);
  const assignment = await tx.vehicleAssignment.findFirst({ where: { vehicleId, startsAt: { lte: date }, OR: [{ endsAt: null }, { endsAt: { gt: date } }] } });
  if (assignment && assignment.module !== 'NORMAL_RENTAL') throw new ValidationError('This date belongs to another operating module. Use its dedicated register.');
}
export async function transferVehicle(input: unknown, actor: string) {
  const data = transferSchema.parse(input);
  return prisma.$transaction(async tx => {
    const vehicle = await lockVehicle(tx, data.vehicleId);
    if (await tx.rtoDowntime.count({ where: { replacementVehicleId: vehicle.id, replacementReturnedAt: null } })) throw new ConflictError('Return this replacement vehicle before transferring it.');
    const current = await tx.vehicleAssignment.findFirst({ where: { vehicleId: vehicle.id, endsAt: null } });
    if (current?.module === data.toModule) throw new ConflictError('Vehicle already belongs to this module.');
    if (+data.effectiveAt > Date.now() || (current && data.effectiveAt <= current.startsAt)) throw new ValidationError('Transfer must be after the current assignment began and cannot be in the future.');
    if (data.odometerKm < vehicle.currentMileageKm) throw new ValidationError('Handover odometer cannot decrease.');
    const unresolved = await tx.rtoAgreement.count({ where: { vehicleId: vehicle.id, status: { in: ['ACTIVE', 'SUSPENDED', 'IN_DEFAULT'] } } });
    if (unresolved) throw new ConflictError('Resolve the existing RTO agreement before transferring.');
    const latestResolved = await tx.rtoAgreement.findFirst({ where: { vehicleId: vehicle.id, resolvedAt: { not: null } }, orderBy: { resolvedAt: 'desc' } });
    if (current?.module === 'RENT_TO_OWN' && latestResolved?.resolvedAt && data.effectiveAt.toISOString().slice(0, 10) < latestResolved.resolvedAt.toISOString().slice(0, 10)) throw new ConflictError('Transfer cannot precede the previous agreement resolution.');
    const [rental, mileage] = await Promise.all([
      tx.transaction.count({ where: { vehicleId: vehicle.id, date: { gte: data.effectiveAt }, deletedAt: null } }),
      tx.mileageEntry.count({ where: { vehicleId: vehicle.id, date: { gte: data.effectiveAt } } }),
    ]);
    if (current?.module === 'NORMAL_RENTAL' && (rental || mileage)) throw new ConflictError('Transfer date conflicts with existing rental records. Choose a date after those records.');
    if (current) await tx.vehicleAssignment.update({ where: { id: current.id }, data: { endsAt: data.effectiveAt } });
    await tx.vehicleAssignment.create({ data: { vehicleId: vehicle.id, module: data.toModule, startsAt: data.effectiveAt } });
    const result = await tx.vehicleTransfer.create({ data: { ...data, fromModule: current?.module ?? 'UNASSIGNED', actor } });
    await tx.vehicle.update({ where: { id: vehicle.id }, data: { currentMileageKm: data.odometerKm } });
    await audit(tx, 'FLEET', vehicle.id, 'TRANSFER', actor, { transferId: result.id, ...JSON.parse(JSON.stringify(data)) });
    return result;
  }, TRANSACTION_OPTIONS);
}
