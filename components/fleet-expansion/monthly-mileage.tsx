import { DataTable } from './presentation';
import { prisma } from '@/lib/db/client';
import { mileageTotals } from '@/lib/monthly-mileage';
import { businessToday, isoWeekStart } from '@/lib/date-ranges';
export async function MonthlyMileage({vehicleId,rto=false}:{vehicleId:string;rto?:boolean}) {
  const today=businessToday(); const from=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1));
  const since=new Date(Math.min(+from,+isoWeekStart(today)));
  const readings=rto ? await prisma.rtoMileageEntry.findMany({where:{agreement:{vehicleId},date:{gte:since}},select:{date:true,distanceKm:true}}) : (await prisma.mileageEntry.findMany({where:{vehicleId,date:{gte:since}},select:{date:true,distanceDrivenKm:true}})).map(r=>({date:r.date,distanceKm:r.distanceDrivenKm}));
  const m=mileageTotals(readings,today);
  return <section className="my-4 rounded-xl border border-border p-4"><h2 className="text-lg font-semibold">Mileage this month · {today.toISOString().slice(0,7)}</h2><p>{m.monthKm.toLocaleString()} / 8,000 km · {m.remainingKm.toLocaleString()} km remaining · {m.averagePerDay} km per calendar day so far</p><DataTable headers={["This week (km)","This month (km)","Monthly limit (km)","Remaining (km)","Average / day (km)"]} rows={[[m.weekKm.toLocaleString(),m.monthKm.toLocaleString(),"8,000",m.remainingKm.toLocaleString(),m.averagePerDay]]} />
    {m.monthOver ? <p role="alert" className="font-semibold text-red-600">Monthly limit exceeded by {(m.monthKm-8000).toLocaleString()} km. Contact the driver.</p> : m.weekOver ? <p className="text-amber-600">Weekly warning: reduce mileage during the rest of this month.</p> : null}
  </section>;
}
