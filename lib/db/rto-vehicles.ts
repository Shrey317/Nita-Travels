import { z } from 'zod';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { audit } from './fleet-assignment';
import { vehicleSchema } from '../schemas/vehicle.schema';
import { money } from '../rto';

export async function createRtoVehicle(input: unknown, actor: string) {
  const raw = z.object({ purchasePrice: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/) }).passthrough().parse(input);
  const data = vehicleSchema.parse({ ...raw, purchasePriceCents: money(raw.purchasePrice).times(100).toNumber() });
  return prisma.$transaction(async tx => {
    const vehicle = await tx.vehicle.create({ data: { ...data, assignments: { create: { module: 'RENT_TO_OWN', startsAt: data.purchaseDate } } } });
    await audit(tx, 'RTO', vehicle.id, 'VEHICLE_CREATED', actor, { module: 'RENT_TO_OWN' });
    return { id: vehicle.id, registration: vehicle.registration };
  }, TRANSACTION_OPTIONS);
}
