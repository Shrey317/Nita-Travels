import { businessToday, addDays, isoWeekStart } from './date-ranges';
export function mileageTotals(readings: {date:Date; distanceKm:number}[], today=businessToday()) {
  const start=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1));
  const end=addDays(today,1); const week=isoWeekStart(today);
  const total=(from:Date)=>readings.filter(r=>r.date>=from&&r.date<end).reduce((n,r)=>n+r.distanceKm,0);
  const monthKm=total(start),weekKm=total(week);
  return {monthKm,weekKm,remainingKm:Math.max(8000-monthKm,0),monthOver:monthKm>8000,weekOver:weekKm>2000,averagePerDay:Math.round(monthKm/today.getUTCDate())};
}
