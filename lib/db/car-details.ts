import { z } from 'zod';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { lockVehicle, audit } from './fleet-assignment';
import { money } from '../rto';
export async function saveCarDetails(input: unknown, actor: string) {
  const data = z.object({ vehicleId: z.string().min(1), modelYear: z.coerce.number().int().min(1950).max(new Date().getFullYear()+1), handlerName: z.string().trim().min(1).max(100), purchaseCompany: z.string().trim().max(200).optional(), fidelityMonthly: z.string().regex(/^\d{1,5}(\.\d{1,2})?$/) }).parse(input);
  return prisma.$transaction(async tx => {
    const previous = await lockVehicle(tx,data.vehicleId);
    const values = { modelYear:data.modelYear, handlerName:data.handlerName, purchaseCompany:data.purchaseCompany ?? null, fidelityMonthlyCents:money(data.fidelityMonthly).times(100).toNumber() };
    await tx.vehicle.update({where:{id:data.vehicleId},data:values});
    await audit(tx,'FLEET',data.vehicleId,'CAR_DETAILS_UPDATED',actor,{before:{modelYear:previous.modelYear,handlerName:previous.handlerName,purchaseCompany:previous.purchaseCompany,fidelityMonthlyCents:previous.fidelityMonthlyCents},after:values});
    return {id:data.vehicleId};
  },TRANSACTION_OPTIONS);
}
