import { getFollowUps } from '@/lib/db/rto-follow-ups';
import Link from 'next/link';
import { requireSession } from '@/lib/api-response';
import { rtoReport } from '@/lib/db/rto-report';
import { businessToday } from '@/lib/date-ranges';
import { Metrics, ModuleHeader, day, zar } from '@/components/fleet-expansion/presentation';
import { CollectionsChart } from '@/components/fleet-expansion/collections-chart';
export const dynamic = 'force-dynamic';
const statusLabel: Record<string, string> = { DRAFT: 'Draft', ACTIVE: 'Active', SUSPENDED: 'Paused', IN_DEFAULT: 'Needs attention', COMPLETED: 'Completed', TERMINATED: 'Ended', CANCELLED: 'Cancelled' };
export default async function RtoPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireSession(); const params = await searchParams;
  const today = businessToday();
  const report = await rtoReport({ ...params, from: undefined, to: undefined }); const { rows, range } = report;
  const followUps = (await getFollowUps(rows.map(r => r.id))).filter(n => !n.done);
  const query = new URLSearchParams(Object.entries(params).filter((p): p is [string, string] => p[1] !== undefined));
  const pageLink = (page: number) => { const q = new URLSearchParams(query); q.set('page', String(page)); return `/rent-to-own?${q}`; };
  const active = rows.filter(r => ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status));
  const queue = rows.map(agreement => {
    const issues = [];
    if (followUps.some(n => n.agreementId === agreement.id && n.dueDate <= today)) issues.push('Follow-up due');
    if (Number(agreement.amountDue) > 0) issues.push(agreement.paymentStatus);
    if (agreement.status === 'IN_DEFAULT' && Number(agreement.amountDue) === 0) issues.push('Review agreement status');
    if (agreement.unavailable) issues.push('Off the road');
    if (agreement.status === 'DRAFT') issues.push(agreement.documents.some(document => document.kind === 'SIGNED_CONTRACT') ? 'Start agreement' : 'Signed agreement missing');
    if (['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(agreement.status)) {
      if (!agreement.mileage[0] || +today - +agreement.mileage[0].date > 7 * 86400000) issues.push('Mileage reading due');
      else if (agreement.mileage[0].reviewRequired) issues.push('Mileage needs review');
    }
    return { agreement, issues };
  }).sort((a, b) => b.agreement.daysLate - a.agreement.daysLate || Number(b.issues.length > 0) - Number(a.issues.length > 0)
    || Number(b.agreement.amountDue) - Number(a.agreement.amountDue));
  const visibleQueue = queue.filter(({ agreement, issues }) => !params.view || params.view === 'all' || (params.view === 'overdue' && agreement.daysLate > 0) || (params.view === 'today' && agreement.paymentStatus === 'Due today') || (params.view === 'attention' && issues.length > 0));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><ModuleHeader title="Rent-to-Own" description="Your vehicles, drivers and rental payments in one place." />{session.staffRole === 'ADMIN' && <Link className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white" href="/rent-to-own/manage">Add vehicle or agreement</Link>}</div>
    <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
      <label className="min-w-0 flex-1 text-sm">Find a vehicle or driver<input name="q" defaultValue={params.q} placeholder="Vehicle, driver or agreement" className="block w-full rounded border bg-background p-2" /></label>
      <label className="text-sm">Status<select name="status" defaultValue={params.status} className="block rounded border bg-background p-2"><option value="">All</option>{Object.entries(statusLabel).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="rounded-lg bg-primary px-4 py-2 text-white">Apply</button>
    </form>
    <nav aria-label="Payment filters" className="flex flex-wrap gap-2">{([['all','All'],['overdue','Overdue'],['today','Due today'],['attention','Needs attention']] as const).map(([value,label]) => {
      const filter = new URLSearchParams(query); filter.set('view', value); filter.delete('page');
      return <Link key={value} aria-current={(params.view ?? 'all') === value ? 'page' : undefined} className="rounded-lg border border-border px-4 py-2 text-sm aria-[current=page]:bg-primary aria-[current=page]:text-white" href={`/rent-to-own?${filter}`}>{label}</Link>;
    })}</nav>
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Vehicles & drivers</h2>
        <Link className="text-sm underline" href="/rent-to-own/agreements">View all agreements</Link>
      </div>
      <p className="my-2 text-sm text-muted">Amounts due as of {day(range.to)} include unpaid rent, deposit instalments and other charges.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {visibleQueue.slice((range.page - 1) * 20, range.page * 20).map(({ agreement: r, issues }) => (
          <article key={r.id} className="min-w-0 rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><h3 className="font-semibold break-words">{r.driver.name}</h3><Link className="text-sm underline" href={`/rent-to-own/agreements/${r.id}`}>{r.vehicleId} · {r.vehicle.registration}</Link></div>
              <div><p className="text-sm text-muted">Due now</p><p className="text-xl font-semibold">{zar(r.amountDue)}</p></div>
            </div>
            <p className="mt-3 text-sm">Deposit left: <strong>{zar(r.depositLeft)}</strong></p>
            {followUps.filter(n => n.agreementId === r.id).map(n => <p key={n.id} className="mt-2 break-words text-sm">Follow up {day(n.dueDate)}: {n.note}</p>)}
            <p className="my-3 text-sm">{r.status === 'DRAFT' ? 'Not started' : r.paymentStatus}{r.daysLate > 0 ? ` · ${r.daysLate} days late` : ''}</p>
            <div className="flex flex-wrap gap-3 text-sm">{issues.map(issue => {
              const target = issue === 'Follow-up due' ? 'overview' : issue.startsWith('Mileage') ? 'mileage' : issue === 'Signed agreement missing' ? 'documents' : issue === 'Off the road' ? 'downtime' : issue === 'Start agreement' ? 'overview' : 'payments';
              return <Link key={issue} className="underline" href={`/rent-to-own/agreements/${r.id}?tab=${target}`}>{issue}</Link>;
            })}</div>
            <details className="my-3 text-sm"><summary className="cursor-pointer">Balance details</summary><p className="mt-2">Deposit left {zar(r.depositLeft)}</p><ul className="mt-2 space-y-2">{r.dueItems.map((item, index) => <li key={index}>{item.label} · {day(item.date)} · {zar(item.amount)}</li>)}</ul></details>
            {session.staffRole === 'ADMIN' && ['ACTIVE','SUSPENDED','IN_DEFAULT'].includes(r.status)
              ? <Link aria-label={`Add payment for ${r.driver.name}, ${r.vehicleId}`} className="inline-block rounded-lg bg-primary px-4 py-3 text-sm text-white" href={`/rent-to-own/agreements/${r.id}?tab=entries`}>Add payment</Link>
              : <Link className="underline" href={`/rent-to-own/agreements/${r.id}`}>Open agreement</Link>}
          </article>
        ))}
      </div>
      {!visibleQueue.length && <p>No matching agreements.</p>}
      <div className="mt-3 flex gap-4 text-sm">{range.page > 1 && <Link href={pageLink(range.page - 1)}>Previous</Link>}<span>Page {range.page} · {visibleQueue.length} agreements</span>{range.page * 20 < visibleQueue.length && <Link href={pageLink(range.page + 1)}>Next</Link>}</div>
    </section>
    <details className="rounded-xl border border-border bg-card p-5"><summary className="cursor-pointer font-semibold">Collection charts & exports</summary><Metrics items={[
      ['Active cars', new Set(active.map(r => r.vehicleId)).size], ['Rent collected', zar(report.collected)], ['Rent expected', zar(report.expected)], ['Total due', zar(report.totalOutstanding)],
    ]} /><CollectionsChart title="Rent expected and collected" data={report.chart} /><nav aria-label="RTO report exports" className="flex flex-wrap gap-4 text-sm">{['agreements','payments','mileage','repairs'].map(type => <a key={type} className="capitalize underline" href={`/api/rent-to-own/export?${query}&type=${type}`}>Export {type}</a>)}</nav><Link className="mt-4 block text-sm underline" href="/rent-to-own/reports">More reports</Link></details>
  </div>;
}
