import Link from 'next/link';
import { requireSession } from '@/lib/api-response';
import { rtoReport } from '@/lib/db/rto-report';
import { DataTable, Metrics, ModuleHeader, day, zar } from '@/components/fleet-expansion/presentation';
import { CollectionsChart } from '@/components/fleet-expansion/collections-chart';
export const dynamic = 'force-dynamic';
const statusLabel: Record<string, string> = { DRAFT: 'Draft', ACTIVE: 'Active', SUSPENDED: 'Paused', IN_DEFAULT: 'Needs attention', COMPLETED: 'Completed', TERMINATED: 'Ended', CANCELLED: 'Cancelled' };
export default async function RtoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession(); const params = await searchParams;
  const report = await rtoReport(params); const { rows, range } = report;
  const query = new URLSearchParams(Object.entries(params).filter((p): p is [string, string] => p[1] !== undefined));
  const pageLink = (page: number) => { const q = new URLSearchParams(query); q.set('page', String(page)); return `/rent-to-own?${q}`; };
  const active = rows.filter(r => ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status));
  const queue = rows.map(agreement => {
    const issues = [];
    if (Number(agreement.amountDue) > 0) issues.push('Payment due');
    if (agreement.status === 'IN_DEFAULT') issues.push('Follow up');
    if (agreement.unavailable) issues.push('Off the road');
    if (agreement.status === 'DRAFT') issues.push('Finish setup');
    return { agreement, issues };
  }).sort((a, b) => Number(b.issues.length > 0) - Number(a.issues.length > 0)
    || Number(b.agreement.amountDue) - Number(a.agreement.amountDue));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><ModuleHeader title="Rent-to-Own" description="Your vehicles, drivers and rental payments in one place." />{session.staffRole === 'ADMIN' && <Link className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white" href="/rent-to-own/manage">Add vehicle or agreement</Link>}</div>
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="text-sm">From<input aria-label="From" type="date" name="from" defaultValue={day(range.from)} className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">To<input aria-label="To" type="date" name="to" defaultValue={day(range.to)} className="block rounded border bg-background p-2" /></label>
      <label className="min-w-0 flex-1 text-sm">Find a vehicle or driver<input name="q" defaultValue={params.q} placeholder="Vehicle, driver or agreement" className="block w-full rounded border bg-background p-2" /></label>
      <label className="text-sm">Status<select name="status" defaultValue={params.status} className="block rounded border bg-background p-2"><option value="">All</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="rounded-lg bg-primary px-4 py-2 text-white">Apply</button>
    </form>
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Vehicles & drivers</h2>
        <Link className="text-sm underline" href="/rent-to-own/agreements">View all agreements</Link>
      </div>
      <p className="my-2 text-sm text-muted">Amounts due as of {day(range.to)} include unpaid rent, deposit instalments and other charges.</p>
      <DataTable headers={['Driver', 'Car / agreement', 'Amount due', 'Needs attention', 'Action']} rows={queue.slice((range.page - 1) * 20, range.page * 20).map(({ agreement: r, issues }) => [
        r.driver.name,
        <Link key={r.id} prefetch={false} className="underline" href={`/rent-to-own/agreements/${r.id}`}>{r.vehicleId} · {r.vehicle.registration} · {r.number}</Link>,
        <span key="due" className={Number(r.amountDue) > 0 ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}>{zar(r.amountDue)}</span>,
        issues.join(' · ') || statusLabel[r.status],
        session.staffRole === 'ADMIN' && ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status)
          ? <Link key="payment" prefetch={false} aria-label={`Add payment for ${r.driver.name}, ${r.vehicleId}`} className="whitespace-nowrap rounded-lg bg-primary px-3 py-2 text-sm text-white" href={`/rent-to-own/agreements/${r.id}?tab=entries`}>Add payment</Link>
          : <Link key="open" className="whitespace-nowrap underline" href={`/rent-to-own/agreements/${r.id}`}>Open agreement</Link>,
      ])} empty="No matching agreements." />
      <div className="mt-3 flex gap-4 text-sm">{range.page > 1 && <Link href={pageLink(range.page - 1)}>Previous</Link>}<span>Page {range.page} · {queue.length} agreements</span>{range.page * 20 < queue.length && <Link href={pageLink(range.page + 1)}>Next</Link>}</div>
    </section>
    <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Collection charts & exports</summary><Metrics items={[
      ['Active cars', new Set(active.map(r => r.vehicleId)).size], ['Rent collected', zar(report.collected)], ['Rent expected', zar(report.expected)], ['Total due', zar(report.totalOutstanding)],
    ]} /><CollectionsChart title="Rent expected and collected" data={report.chart} /><nav aria-label="RTO report exports" className="flex flex-wrap gap-4 text-sm">{['agreements','payments','mileage','repairs'].map(type => <a key={type} className="capitalize underline" href={`/api/rent-to-own/export?${query}&type=${type}`}>Export {type}</a>)}</nav><Link className="mt-4 block text-sm underline" href="/rent-to-own/reports">More reports</Link></details>
  </div>;
}
