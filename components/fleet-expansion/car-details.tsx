import { prisma } from '@/lib/db/client';
import { ActionForm } from './action-form';
import { zar } from './presentation';
export async function CarDetails({vehicleId,admin,rto=false}:{vehicleId:string;admin:boolean;rto?:boolean}) {
  const car = await prisma.vehicle.findUniqueOrThrow({where:{id:vehicleId}});
  return <section className="my-5 rounded-xl border border-border p-4"><h2 className="text-xl font-semibold">Car details · {car.modelYear ?? 'Year not set'}</h2>
    <p>Manager: {car.handlerName ?? 'Not assigned'} · Bought under: {car.purchaseCompany ?? 'Not set'}</p>
    <p className="mt-2">Manager allowance: R200 per week. Fidelity: {car.fidelityMonthlyCents === null ? 'Rate not set' : `${zar(car.fidelityMonthlyCents/100)} per month`}.</p>
    <p className="mt-2 text-sm text-muted">These costs are included in the driver&apos;s rent. They are not extra driver charges.</p>
    {car.fidelityMonthlyCents !== null && <p className="mt-2 text-sm">Average monthly operating allowance: {zar(200*52/12+car.fidelityMonthlyCents/100)} (manager at 52 weeks per year, plus Fidelity). This is a budget; record actual expenses separately.</p>}
    {admin && <ActionForm title="Edit car details" endpoint="/api/rent-to-own/car-details" fixed={{vehicleId}} successHref={rto ? `/rent-to-own/vehicles/${vehicleId}/details` : `/vehicles/${vehicleId}`} fields={[
      {name:'modelYear',label:'Model year',type:'number',value:car.modelYear ?? undefined},
      {name:'handlerName',label:'Manager handling this car',value:car.handlerName ?? ''},
      {name:'purchaseCompany',label:'Company the car was bought under',value:car.purchaseCompany ?? '',optional:true},
      {name:'fidelityMonthly',label:'Fidelity monthly cost (R)',value:car.fidelityMonthlyCents === null ? '' : (car.fidelityMonthlyCents/100).toFixed(2)},
    ]} />}
  </section>;
}
