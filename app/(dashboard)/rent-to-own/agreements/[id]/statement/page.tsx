import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/api-response';
import { getRtoAgreement } from '@/lib/db/rto';
import { money, sumMoney, installmentBalance } from '@/lib/rto';
import { paymentSummary, rtoStatusLabel } from '@/lib/rto-summary';
import { depositPart, rentPart } from '@/lib/rto-deposit';
import { businessToday } from '@/lib/date-ranges';
import { day, zar, DataTable } from '@/components/fleet-expansion/presentation';
import { PrintButton } from '@/components/fleet-expansion/print-button';

export const dynamic = 'force-dynamic';
export default async function Statement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ payment?: string }> }) {
  await requireSession();
  const a = await getRtoAgreement((await params).id);
  const selected = (await searchParams).payment;
  const receipt = selected ? a.payments.find(p => p.id === selected) : undefined;
  if (selected && !receipt) notFound();
  const today = businessToday();
  const summary = paymentSummary([
    ...a.installments.map(i => ({ date: i.effectiveDueDate, amount: money(i.balance).plus(i.depositBalance).toFixed(2) })),
    ...a.charges.map(c => ({ date: c.date, amount: installmentBalance(c.amount, c.allocations).toFixed(2) })),
  ], today);
  const payments = receipt ? [receipt] : a.payments;
  return <>
    <style>{`@media print { body * { visibility: hidden; } #rto-statement, #rto-statement * { visibility: visible; } #rto-statement { position: absolute; inset: 0; background: white; color: black; padding: 15px; } #rto-statement .overflow-x-auto { overflow: visible; } #rto-statement header { display: block !important; } #rto-statement table { font-size: 10px; } #rto-statement tr { break-inside: avoid; } }`}</style>
    <div className="mb-5 flex flex-wrap gap-4 print:hidden"><a className="underline" href={`/rent-to-own/agreements/${a.id}?tab=payments`}>Back to payment history</a><PrintButton /></div>
    <article id="rto-statement" className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5">
      <header><h1 className="text-2xl font-semibold">Nita Travels · {receipt ? 'Payment receipt' : 'Driver statement'}</h1><p>{a.driver.name} · {a.number}</p><p>{a.vehicleId} · {a.vehicle.registration} · {rtoStatusLabel[a.status]}</p><p>Prepared {day(today)}</p></header>
      {!receipt && <><section><h2 className="font-semibold">Due now: {zar(summary.totalDue)}</h2><p>Overdue {zar(summary.overdue)} · Due today {zar(summary.dueToday)}</p><p>Deposit paid {zar(a.upfrontReceived)} / {zar(a.upfrontRequired)} · Deposit left {zar(a.depositRemaining)}</p><p>Remaining scheduled rent {zar(a.scheduledBalance)} · Other charges left {zar(a.chargeBalance)}</p><p>Total remaining: {zar(sumMoney([a.scheduledBalance, a.depositRemaining, a.chargeBalance]))}. Includes future payments; not an early payoff quote.</p><p>Unallocated rent credit: {zar(a.unallocatedRent)}</p></section>
      <section><h2 className="text-lg font-semibold">Unpaid weeks due now</h2><DataTable headers={['Week','Due date','Rent left','Deposit left']} rows={a.installments.filter(i => +i.effectiveDueDate < +today + 86400000 && money(i.balance).plus(i.depositBalance).gt(0)).map(i => [i.sequence, day(i.effectiveDueDate), zar(i.balance), zar(i.depositBalance)])} /></section></>}
      <section><h2 className="text-lg font-semibold">{receipt ? receipt.reference : 'Payments'}</h2><DataTable headers={['Date','Reference','Rent','Deposit','Other','Total','Paid by','Status']} rows={payments.map(p => [day(p.date), p.reference, zar(rentPart(p)), zar(depositPart(p)), zar(money(p.amount).minus(rentPart(p)).minus(depositPart(p))), zar(p.amount), p.method, p.reversedAt ? `Undone ${day(p.reversedAt)}: ${p.reversalReason}` : 'Received'])} /></section>
      {!receipt && <section><h2 className="text-lg font-semibold">Extra charges</h2><DataTable headers={['Date','Description','Charged','Left']} rows={a.charges.map(c => [day(c.date), c.description, zar(c.amount), zar(installmentBalance(c.amount, c.allocations))])} /></section>}
    </article>
  </>;
}
