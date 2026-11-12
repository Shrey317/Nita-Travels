import { normalRentalVehicles } from '@/lib/db/module-scope';
import Link from 'next/link';
import { requireSession } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { businessToday, dateKey } from '@/lib/date-ranges';
import { OperationsRegister } from './operations-register';
export async function RegisterPage({ mode, searchParams }: { mode: 'documents' | 'work-orders'; searchParams: Promise<{ page?: string; vehicleId?: string }> }) {
  const session = await requireSession();
  const query = await searchParams;
  const candidate = Number(query.page || 1);
  const page = Number.isSafeInteger(candidate) && candidate > 0 ? Math.min(candidate, 100000) : 1;
  const where = { archived: false, ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}) };
  const [records, total, vehicles, expenses] = await Promise.all([
    mode === 'documents' ? prisma.fleetDocument.findMany({ where, orderBy: [{ expiryDate: 'asc' }, { id: 'asc' }], take: 25, skip: (page - 1) * 25 }) : prisma.workOrder.findMany({ where, orderBy: [{ plannedDate: 'desc' }, { id: 'asc' }], take: 25, skip: (page - 1) * 25 }),
    mode === 'documents' ? prisma.fleetDocument.count({ where }) : prisma.workOrder.count({ where }),
    prisma.vehicle.findMany({ where: { deletedAt: null, ...normalRentalVehicles }, select: { id: true, registration: true }, orderBy: { id: 'asc' } }),
    prisma.transaction.findMany({ where: { deletedAt: null, incomeZarCents: 0, OR: [{ expenseZarCents: { gt: 0 } }, { category: 'Service' }] }, select: { id: true, vehicleId: true, date: true, expenseZarCents: true }, orderBy: [{ date: 'desc' }, { id: 'desc' }], take: 200 }),
  ]);
  const rows = records.map(record => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, value instanceof Date ? dateKey(value) : value]))) as { id: string; vehicleId: string; title: string }[];
  const href = (number: number) => `/${mode}?page=${number}${query.vehicleId ? '&vehicleId=' + encodeURIComponent(query.vehicleId) : ''}`;
  return <div className="space-y-5"><h1 className="text-2xl font-semibold">{mode === 'documents' ? 'Document register' : 'Service & repair planning'}</h1>
    <form className="flex gap-2"><label>Vehicle filter<select name="vehicleId" defaultValue={query.vehicleId || ''} className="ml-2 rounded border border-border bg-background p-2"><option value="">All vehicles</option>{vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.id}</option>)}</select></label><button className="underline" type="submit">Apply filter</button></form>
    <OperationsRegister mode={mode} rows={rows} vehicles={vehicles} expenses={expenses.map(expense => ({ ...expense, date: dateKey(expense.date) }))} isAdmin={session.staffRole === 'ADMIN'} today={dateKey(businessToday())} />
    <nav aria-label="Register pages" className="flex gap-4">{page > 1 && <Link href={href(page - 1)}>Previous</Link>}{page * 25 < total && <Link href={href(page + 1)}>Next</Link>}</nav>
  </div>;
}
