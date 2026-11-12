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
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><ModuleHeader title="Rent-to-Own" description="Your vehicles, drivers and rental payments in one place." />{session.staffRole === 'ADMIN' && <Link className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white" href="/rent-to-own/manage">Add vehicle or agreement</Link>}</div>
    <nav aria-label="Rent-to-Own quick actions" className="grid gap-3 sm:grid-cols-3">{[['payments','Record a payment','Choose a driver and add their payment.'], ['mileage','Update mileage','Record the latest odometer reading.'], ['repairs','Manage repairs','Track repair work and shared costs.']].map(([path,title,description]) => <Link prefetch={false} key={path} href={`/rent-to-own/${path}`} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"><span className="font-semibold">{title} →</span><p className="mt-2 text-sm text-muted">{description}</p></Link>)}</nav>
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="text-sm">From<input aria-label="From" type="date" name="from" defaultValue={day(range.from)} className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">To<input aria-label="To" type="date" name="to" defaultValue={day(range.to)} className="block rounded border bg-background p-2" /></label>
      <label className="min-w-0 flex-1 text-sm">Find a vehicle or driver<input name="q" defaultValue={params.q} placeholder="Vehicle, driver or agreement" className="block w-full rounded border bg-background p-2" /></label>
      <label className="text-sm">Status<select name="status" defaultValue={params.status} className="block rounded border bg-background p-2"><option value="">All</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="rounded-lg bg-primary px-4 py-2 text-white">Apply</button>
    </form>
    <Metrics items={[
      ['Active vehicles', new Set(active.map(r => r.vehicleId)).size], ['Rent collected in period', zar(report.collected)], ['Rent expected in period', zar(report.expected)], ['Total due at period end', zar(report.totalOutstanding)],
    ]} />
    <section><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Vehicles & drivers</h2><Link className="text-sm underline" href="/rent-to-own/agreements">View all agreements</Link></div><p className="mt-2 text-sm text-muted">Payment status below covers {day(range.from)} to {day(range.to)}. Open an agreement for the full balance and history.</p>
    <DataTable headers={['Vehicle / agreement', 'Driver', 'Weekly rent', 'Rent due in period', 'Agreement', 'Actions']} rows={rows.slice((range.page - 1) * 20, range.page * 20).map(r => [
      <div key={r.id}><p className="font-semibold">{r.vehicleId} · {r.vehicle.registration}</p><Link prefetch={false} className="text-sm text-muted underline" href={`/rent-to-own/agreements/${r.id}`}>{r.number}</Link></div>, r.driver.name, zar(r.weeklyAmount),
      r.status === 'DRAFT' ? 'Not started' : r.outstandingAmount > 0 ? <span className="font-semibold text-amber-700 dark:text-amber-300">{zar(r.outstandingAmount)} unpaid</span> : 'No unpaid rent in period',
      statusLabel[r.status], <Link key="open" prefetch={false} className="whitespace-nowrap rounded-lg border border-border px-3 py-2 text-sm" href={`/rent-to-own/agreements/${r.id}`}>Open agreement →</Link>,
    ])} empty="No agreements yet. Start by adding a vehicle and driver." />
    <div className="flex gap-4 text-sm">{range.page > 1 && <Link href={pageLink(range.page - 1)}>Previous</Link>}<span>Page {range.page} · {rows.length} agreements</span>{range.page * 20 < rows.length && <Link href={pageLink(range.page + 1)}>Next</Link>}</div></section>
    <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Collection charts & exports</summary><CollectionsChart title="Rent expected and collected" data={report.chart} /><nav aria-label="RTO report exports" className="flex flex-wrap gap-4 text-sm">{['agreements','payments','mileage','repairs'].map(type => <a key={type} className="capitalize underline" href={`/api/rent-to-own/export?${query}&type=${type}`}>Export {type}</a>)}</nav><Link className="mt-4 block text-sm underline" href="/rent-to-own/reports">More reports</Link></details>
  </div>;
}
