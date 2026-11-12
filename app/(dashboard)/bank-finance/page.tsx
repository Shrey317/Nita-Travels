import Link from 'next/link';
import { requireAdmin } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { sumMoney } from '@/lib/rto';
import { bankSchedule } from '@/lib/bank-schedule';
import { reportRange } from '@/lib/db/rto-report';
import { ActionForm } from '@/components/fleet-expansion/action-form';
import { DataTable, Metrics, ModuleHeader, day, zar } from '@/components/fleet-expansion/presentation';
import { CollectionsChart } from '@/components/fleet-expansion/collections-chart';
export const dynamic = 'force-dynamic';
export default async function BankPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin(); const params = await searchParams; const range = reportRange(params);
  const [rows, vehicles] = await Promise.all([
    prisma.bankFinanceAgreement.findMany({ where: { ...(params.vehicleId ? { vehicleId: params.vehicleId } : {}), ...(params.bank ? { bank: { contains: params.bank, mode: 'insensitive' } } : {}) }, orderBy: { vehicleId: 'asc' }, include: {
      payments: { where: { date: { lt: range.until }, OR: [{ reversedAt: null }, { reversedAt: { gte: range.until } }] } }, statements: { where: { date: { lt: range.until } }, orderBy: { date: 'desc' } }, adjustments: { where: { date: { lt: range.until } }, orderBy: { date: 'desc' }, take: 1 },
    } }),
    prisma.vehicle.findMany({ where: { deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: 'asc' } }),
  ]);
  const filtered = rows.filter(r => !params.status || r.status === params.status);
  const reconciliation = filtered.filter(r => !r.statements[0] || r.payments.some(p => p.date > r.statements[0]!.date || p.principal === null || p.interest === null || p.fees === null) || r.adjustments.some(a => a.date > r.statements[0]!.date));
  const payments = filtered.flatMap(r => r.payments.filter(p => p.date >= range.from)); const verified = filtered.flatMap(r => r.statements.slice(0, 1));
  const schedules = filtered.filter(r => r.status === 'ACTIVE').flatMap(r => bankSchedule(r.firstDueDate, r.termMonths, r.monthlyAmount, r.payments, range.until, r.paymentFrequency, r.maturityDate) ?? []);
  const chart = filtered.map(r => ({ label: r.vehicleId, expected: sumMoney((bankSchedule(r.firstDueDate, r.termMonths, r.monthlyAmount, r.payments, range.until, r.paymentFrequency, r.maturityDate) ?? []).filter(i => i.date >= range.from && i.date < range.until).map(i => i.amount)).toNumber(), collected: sumMoney(r.payments.filter(p => p.date >= range.from).map(p => p.amount)).toNumber() }));
  return <><ModuleHeader title="Private Bank Finance" description="Administrator-only records of company obligations. Driver payments never reduce these balances." />
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="text-sm">From<input type="date" name="from" defaultValue={day(range.from)} className="block rounded border bg-background p-2" /></label><label className="text-sm">To<input type="date" name="to" defaultValue={day(range.to)} className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">Vehicle<select name="vehicleId" defaultValue={params.vehicleId} className="block rounded border bg-background p-2"><option value="">All vehicles</option>{vehicles.map(v => <option key={v.id}>{v.id}</option>)}</select></label><label className="text-sm">Bank<input name="bank" defaultValue={params.bank} className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">Status<select name="status" defaultValue={params.status} className="block rounded border bg-background p-2"><option value="">All</option>{['ACTIVE','SETTLED','REFINANCED'].map(s => <option key={s}>{s}</option>)}</select></label><button className="rounded bg-teal p-2 text-ink">Apply</button>
    </form>
    <p className="mt-3 text-sm text-muted">Payment totals use the selected period. Statements show the latest verified position at period end. Counts reflect current agreement status.</p>
    <Metrics items={[
      ['Finance records requiring reconciliation', reconciliation.length],
      ['Overdue contractual instalments at period end', schedules.filter(i => i.date < range.until && i.balance.gt(0)).length], ['Unpaid instalments in next 30 days', schedules.filter(i => i.date >= range.until && +i.date < +range.until + 30 * 86400000 && i.balance.gt(0)).length], ['Agreements without verified first due date', filtered.filter(r => !r.firstDueDate).length],
      ['Financed vehicles', new Set(filtered.map(r => r.vehicleId)).size], ['Original financed principal', zar(sumMoney(filtered.map(r => r.originalPrincipal)))], ['Actual bank payments in period', zar(sumMoney(payments.map(p => p.amount)))], ['Known principal components in period', zar(sumMoney(payments.filter(p => p.principal !== null).map(p => p.principal!)))],
      ['Latest verified balances (covered records)', verified.length ? zar(sumMoney(verified.map(s => s.outstandingPrincipal))) : 'Not Yet Verified'], ['Statement coverage', `${verified.length} / ${filtered.length}`], ['Active finance agreements', filtered.filter(r => r.status === 'ACTIVE').length], ['Settled finance agreements', filtered.filter(r => r.status === 'SETTLED').length], ['Payments needing component reconciliation', payments.filter(p => p.principal === null || p.interest === null || p.fees === null).length], ['Latest reported bank arrears', verified.length ? zar(sumMoney(verified.map(s => s.arrears))) : 'Not Yet Verified'],
    ]} />
    <CollectionsChart data={chart} title="Contractual instalments vs actual bank payments in selected period" />
    <DataTable headers={['Vehicle', 'Bank / reference', 'Status', 'Original principal', 'Contractual instalment', 'Latest statement', 'Verified outstanding', 'Settlement quote', 'Quote expiry']} rows={filtered.map(r => { const s = r.statements[0]; const quote = r.statements.find(statement => statement.settlementAmount !== null); return [<Link key={r.id} className="underline" href={`/bank-finance/${r.id}`}>{r.vehicleId}</Link>, `${r.bank} · ${r.reference}`, r.status, zar(r.originalPrincipal), zar(r.monthlyAmount), day(s?.date), zar(s?.outstandingPrincipal), zar(quote?.settlementAmount), day(quote?.quotationExpiry)]; })} />
    <ActionForm title="Create bank-finance agreement" endpoint="/api/bank-finance/agreements" description="Finance agreement linked to the permanent vehicle identity. Resolve existing finance before registering refinancing. Do not copy estimated vehicle balances as verified bank figures." fields={[
      { name: 'paymentFrequency', label: 'Payment frequency', value: 'MONTHLY', options: ['WEEKLY','FORTNIGHTLY','MONTHLY','QUARTERLY'].map(value => ({ value, label: value })) },
      { name: 'firstDueDate', label: 'First contractual instalment due date', type: 'date', optional: true },
      { name: 'vehicleId', label: 'Vehicle', options: vehicles.map(v => ({ value: v.id, label: `${v.id} · ${v.registration}` })) }, { name: 'bank', label: 'Bank name' }, { name: 'reference', label: 'Internal finance reference' }, { name: 'startDate', label: 'Commencement date', type: 'date' }, { name: 'originalPrincipal', label: 'Original amount financed (R)' }, { name: 'termMonths', label: 'Original term (months)', type: 'number' }, { name: 'monthlyAmount', label: 'Contractual instalment per payment period (R)' }, { name: 'interestRate', label: 'Interest rate (%)', optional: true }, { name: 'maturityDate', label: 'Maturity date', type: 'date' },
    ]} />
  </>;
}
