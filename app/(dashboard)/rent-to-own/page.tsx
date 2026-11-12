import Link from 'next/link';
import { requireSession } from '@/lib/api-response';
import { rtoReport } from '@/lib/db/rto-report';
import { DataTable, Metrics, ModuleHeader, ModuleLinks, day, zar } from '@/components/fleet-expansion/presentation';
import { CollectionsChart } from '@/components/fleet-expansion/collections-chart';
export const dynamic = 'force-dynamic';
export default async function RtoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireSession(); const params = await searchParams; const report = await rtoReport(params); const { rows, range } = report;
  const query = new URLSearchParams(Object.entries(params).filter((p): p is [string, string] => p[1] !== undefined));
  const pageLink = (page: number) => { const q = new URLSearchParams(query); q.set('page', String(page)); return `/rent-to-own?${q}`; };
  return <><ModuleLinks /><ModuleHeader title="Rent-to-Own" description="Driver agreements, collections and ownership progress. Financial activity is kept separate from Normal Rental and bank finance." />
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="text-sm">From<input aria-label="From" type="date" name="from" defaultValue={day(range.from)} className="block rounded border bg-background p-2" /></label><label className="text-sm">To<input aria-label="To" type="date" name="to" defaultValue={day(range.to)} className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">Search<input name="q" defaultValue={params.q} placeholder="Vehicle, driver, agreement" className="block rounded border bg-background p-2" /></label>
      <label className="text-sm">Status<select name="status" defaultValue={params.status} className="block rounded border bg-background p-2"><option value="">All statuses</option>{['DRAFT','ACTIVE','SUSPENDED','IN_DEFAULT','COMPLETED','TERMINATED','CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="text-sm">Sort<select name="sort" defaultValue={params.sort} className="block rounded border bg-background p-2"><option value="asc">Agreement ↑</option><option value="desc">Agreement ↓</option></select></label><button className="rounded bg-teal px-4 py-2 text-ink">Apply</button><a className="p-2 underline" href={`/api/rent-to-own/export?${query}`}>Export CSV</a>
    </form>
    <nav aria-label="RTO report exports" className="mt-3 flex flex-wrap gap-4 text-sm">{['payments', 'mileage', 'repairs'].map(type => <a key={type} className="underline" href={`/api/rent-to-own/export?${query}&type=${type}`}>Export {type}</a>)}</nav>
    <p className="mt-3 text-sm text-muted">Collections and obligations use the selected period. Agreement status counts show current state; progress is measured at the period end.</p>
    <Metrics items={[
      ['All driver obligations outstanding at period end', zar(report.totalOutstanding)], ['Weekly contractual rent (current states)', zar(report.currentWeeklyRent)],
      ['RTO vehicles', new Set(rows.filter(r => ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status)).map(r => r.vehicleId)).size],
      ...['ACTIVE','DRAFT','COMPLETED','TERMINATED'].map(s => [`${s.replaceAll('_',' ')} agreements`, rows.filter(r => r.status === s).length] as [string, number]),
      ['Rent expected in period', zar(report.expected)], ['Rent collected', zar(report.collected)], ['Outstanding period instalments', zar(report.outstanding)], ['Overdue instalments', report.overdue], ['Repair invoices', zar(report.repairs)], ['Driver repair contributions assessed', zar(report.contributions)], ['Unavailable at period end', rows.filter(r => r.unavailable).length], ['Within 12 chargeable weeks', rows.filter(r => r.remaining <= 12 && ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status)).length],
    ]} />
    <CollectionsChart title="Monthly expected vs collected rent" data={report.chart} />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <CollectionsChart title="Weekly rental collections" data={report.weeklyChart} />
      <CollectionsChart title="Outstanding driver payments" expectedName="Period rent due (R)" collectedName="Outstanding (R)" data={rows.map(r => ({ label: r.number, expected: r.expectedAmount, collected: r.outstandingAmount }))} />
      <CollectionsChart title="Repair costs by vehicle agreement" expectedName="Invoice costs (R)" collectedName="Driver contributions (R)" data={rows.filter(r => r.repairs.length).map(r => ({ label: `${r.vehicleId} · ${r.number}`, expected: r.repairs.reduce((n, v) => n + v.invoiceAmount.toNumber(), 0), collected: r.repairs.reduce((n, v) => n + v.driverAmount.toNumber(), 0) }))} />
      <CollectionsChart title="Chargeable duration progress distribution" expectedName="Agreements" collectedName="Completed agreements" data={rows.length ? [0,25,50,75].map(min => ({ label: `${min}–${min === 75 ? 100 : min + 24}%`, expected: rows.filter(r => r.progress >= min && (min === 75 || r.progress < min + 25)).length, collected: rows.filter(r => r.status === 'COMPLETED' && r.progress >= min && (min === 75 || r.progress < min + 25)).length })) : []} />
      <CollectionsChart title="Vehicle agreement performance" data={rows.map(r => ({ label: `${r.vehicleId} · ${r.number}`, expected: r.expectedAmount, collected: r.payments.filter(p => p.kind === 'RENT').reduce((n,p) => n + p.amount.toNumber(), 0) }))} />
    </div>
    <h2 className="text-xl font-semibold">Vehicle agreement overview</h2>
    <DataTable headers={['Agreement', 'Vehicle / registration', 'Driver', 'Weekly', 'Start', 'Weeks completed / remaining', 'Period payment status', 'Availability', 'Status', 'Progress']} rows={rows.slice((range.page - 1) * 20, range.page * 20).map(r => [<Link className="underline" href={`/rent-to-own/agreements/${r.id}`} key={r.id}>{r.number}</Link>, `${r.vehicleId} · ${r.vehicle.registration}`, r.driver.name, zar(r.weeklyAmount), day(r.startDate), `${r.completed} / ${r.remaining}`, r.outstanding ? `${r.outstanding} overdue` : 'No overdue instalments', r.unavailable ? 'Downtime' : 'Available', r.status, <span key="progress"><progress value={r.progress} max={100} aria-label="Chargeable duration progress" className="w-20" /> {r.progress}%</span>])} />
    <div className="flex gap-4 text-sm">{range.page > 1 && <Link href={pageLink(range.page - 1)}>Previous</Link>}<span>Page {range.page} · {rows.length} agreements</span>{range.page * 20 < rows.length && <Link href={pageLink(range.page + 1)}>Next</Link>}</div>
    <p className="mt-4 text-sm text-muted">Progress measures chargeable duration and does not establish legal ownership transfer.</p>
  </>;
}
