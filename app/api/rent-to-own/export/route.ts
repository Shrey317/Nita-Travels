import { requireSession, handleApiError } from '@/lib/api-response';
import { rtoReport } from '@/lib/db/rto-report';
import { csvRows } from '@/lib/reports';
import { prisma } from '@/lib/db/client';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    await requireSession(); const query = new URL(request.url).searchParams; const report = await rtoReport(Object.fromEntries(query));
    let csv = csvRows([['Agreement','Vehicle','Registration','Driver','Status','Weekly amount (R)','Chargeable weeks completed','Remaining weeks','Period overdue instalments'], ...report.rows.map(r => [r.number,r.vehicleId,r.vehicle.registration,r.driver.name,r.status,r.weeklyAmount.toFixed(2),r.completed,r.remaining,r.outstanding])]);
    const where = { agreementId: { in: report.rows.map(a => a.id) }, date: { gte: report.range.from, lt: report.range.until } };
    if (query.get('type') === 'payments') {
      const rows = await prisma.rtoPayment.findMany({ where, orderBy: [{ date: 'asc' }, { id: 'asc' }], include: { agreement: { select: { number: true, vehicleId: true } } } });
      csv = csvRows([['Agreement','Vehicle','Date','Reference','Purpose','Amount (R)','Method','Reversed','Notes'], ...rows.map(r => [r.agreement.number,r.agreement.vehicleId,r.date.toISOString().slice(0,10),r.reference,r.kind,r.amount.toFixed(2),r.method,r.reversedAt ? 'Yes' : 'No',r.notes])]);
    }
    if (query.get('type') === 'mileage') {
      const rows = await prisma.rtoMileageEntry.findMany({ where, orderBy: [{ date: 'asc' }, { id: 'asc' }], include: { agreement: { select: { number: true, vehicleId: true } } } });
      csv = csvRows([['Agreement','Vehicle','Date','Odometer km','Weekly distance km','Excess km','Source'], ...rows.map(r => [r.agreement.number,r.agreement.vehicleId,r.date.toISOString().slice(0,10),r.odometerKm,r.distanceKm,r.excessKm,r.source])]);
    }
    if (query.get('type') === 'repairs') {
      const rows = await prisma.rtoRepair.findMany({ where, orderBy: [{ date: 'asc' }, { id: 'asc' }], include: { agreement: { select: { number: true, vehicleId: true } } } });
      csv = csvRows([['Agreement','Vehicle','Date','Description','Invoice (R)','Recovery (R)','Company (R)','Driver (R)'], ...rows.map(r => [r.agreement.number,r.agreement.vehicleId,r.date.toISOString().slice(0,10),r.description,r.invoiceAmount.toFixed(2),r.recoveryAmount.toFixed(2),r.companyAmount.toFixed(2),r.driverAmount.toFixed(2)])]);
    }
    return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="rto-agreements.csv"', 'Cache-Control': 'private, no-store' } });
  } catch (error) { return handleApiError(error); }
}
