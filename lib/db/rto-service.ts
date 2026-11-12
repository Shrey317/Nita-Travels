import { prisma, TRANSACTION_OPTIONS } from './client';
import { lockAgreement, operational } from './rto';
import { audit } from './fleet-assignment';
import { ConflictError, ValidationError } from '../errors';
import { serviceCompletionSchema, servicePlanSchema } from '../schemas/rto.schema';
export async function planRtoService(input: unknown, actor: string) {
  const data = servicePlanSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    if (data.date < agreement.startDate) throw new ValidationError('Planned service cannot precede the agreement.');
    const row = await tx.rtoService.create({ data: { ...data, status: 'PLANNED', plannedDate: data.date, odometerKm: data.targetMileageKm, cost: 0 } });
    await audit(tx, 'RTO', agreement.id, 'SERVICE_PLANNED', actor, { serviceId: row.id, targetMileageKm: data.targetMileageKm, date: data.date.toISOString() }); return row;
  }, TRANSACTION_OPTIONS);
}
export async function completeRtoService(input: unknown, actor: string) {
  const data = serviceCompletionSchema.parse(input);
  return prisma.$transaction(async tx => {
    const agreement = await lockAgreement(tx, data.agreementId); operational(agreement.status);
    const service = await tx.rtoService.findFirstOrThrow({ where: { id: data.serviceId, agreementId: agreement.id } });
    if (service.status !== 'PLANNED') throw new ConflictError('Only planned servicing can be completed.');
    if (data.date < agreement.startDate || data.date > new Date()) throw new ValidationError('Actual servicing must be within the agreement and cannot be future dated.');
    const result = await tx.rtoService.update({ where: { id: service.id }, data: { status: 'COMPLETED', date: data.date, odometerKm: data.odometerKm, cost: data.cost } });
    await tx.vehicle.updateMany({ where: { id: agreement.vehicleId, currentMileageKm: { lt: data.odometerKm } }, data: { currentMileageKm: data.odometerKm } });
    await audit(tx, 'RTO', agreement.id, 'SERVICE_COMPLETED', actor, { serviceId: service.id, actualMileageKm: data.odometerKm, companyCost: data.cost }); return result;
  }, TRANSACTION_OPTIONS);
}
