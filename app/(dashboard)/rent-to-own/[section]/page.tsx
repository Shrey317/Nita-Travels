import { sumMoney } from '@/lib/rto';
import { MonthlyMileage } from '@/components/fleet-expansion/monthly-mileage';
import { rtoReport } from '@/lib/db/rto-report';
import { CollectionsChart } from '@/components/fleet-expansion/collections-chart';
import { depositPart, rentPart } from '@/lib/rto-deposit';
import { AgreementPicker } from '@/components/fleet-expansion/agreement-picker';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { requireSession } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { getFleetNotifications } from '@/lib/db/notifications';
import { DataTable, ModuleHeader, day, zar } from '@/components/fleet-expansion/presentation';

export const dynamic = 'force-dynamic';
const sections: Record<string, [string, string]> = {
  vehicles: ['Vehicles', 'Your Rent-to-Own cars.'],
  agreements: ['Drivers', 'Drivers and their car agreements.'],
  payments: ['Payments', 'Choose a car to add a payment.'],
  mileage: ['Mileage', 'Weekly warnings and calendar-month mileage.'],
  repairs: ['Repairs', 'Repair costs and who pays.'],
  service: ['Scheduled Servicing', 'Plan maintenance, complete services and track company-paid costs.'],
  downtime: ['Time off road', 'Track when a car cannot be used.'],
  documents: ['Files', 'Agreements, receipts and other files.'],
  settlements: ['Pay off early', 'Check the amount needed to finish an agreement early.'],
  alerts: ['Alerts', 'Cars that need attention.'],
  reports: ['Reports', 'View and download Rent-to-Own totals.'],
};
export default async function RtoSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string; q?: string; from?: string; to?: string }> }) {
  const session = await requireSession();
  const { section } = await params; const config = sections[section]; if (!config) notFound();
  const query = await searchParams;
  const historicalReport = section === 'reports' ? await rtoReport(query) : null;
  const exportRange = new URLSearchParams({ from: query.from ?? '', to: query.to ?? '' });
  if (!query.from) exportRange.delete('from');
  if (!query.to) exportRange.delete('to');
  const page = Math.max(1, Math.min(100000, Number.parseInt(query.page ?? '1', 10) || 1));
  const q = (query.q ?? '').trim().slice(0, 100);
  const filter = q ? { OR: [{ payments: { some: { reference: { contains: q, mode: 'insensitive' as const } } } }, { vehicle: { registration: { contains: q, mode: 'insensitive' as const } } }, { number: { contains: q, mode: 'insensitive' as const } }, { vehicleId: { contains: q, mode: 'insensitive' as const } }, { driver: { name: { contains: q, mode: 'insensitive' as const } } }] } : {};
  const pagination = { skip: (page - 1) * 30, take: 31 };
  const tab = ['vehicles', 'agreements'].includes(section) ? 'overview' : section === 'payments' ? 'entries' : section;
  const agreementLink = (a: { id: string; number: string; vehicleId: string }) => <Link prefetch={false} className="underline" href={`/rent-to-own/agreements/${a.id}?tab=${tab}`}>{a.vehicleId} · {a.number}</Link>;
  let headers: string[] = []; let rows: ReactNode[][] = [];
  if (section === 'vehicles') {
    const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: null, assignments: { some: { module: 'RENT_TO_OWN', endsAt: null } }, ...(q ? { OR: [{ id: { contains: q, mode: 'insensitive' } }, { registration: { contains: q, mode: 'insensitive' } }] } : {}) }, select: { id: true, make: true, model: true, modelYear: true, handlerName: true, registration: true, currentMileageKm: true, availability: true, rtoAgreements: { orderBy: { createdAt: 'desc' }, select: { id: true, number: true, vehicleId: true, status: true } } }, orderBy: { id: 'asc' }, ...pagination });
    headers = ['Vehicle', 'Manager', 'Details', 'Registration', 'Lifetime km', 'Availability', 'Agreements'];
    rows = vehicles.map(v => [`${v.id} · ${v.make} ${v.model} ${v.modelYear ?? ""}`, v.handlerName ?? "Not assigned", <a key={`details-${v.id}`} className="underline" href={`/rent-to-own/vehicles/${v.id}/details`}>Car details</a>, v.registration, v.currentMileageKm.toLocaleString(), v.availability, <div key={v.id} className="space-y-2">{v.rtoAgreements.map(a => <div key={a.id}>{agreementLink(a)} · {a.status}</div>)}</div>]);
  } else if (section === 'agreements') {
    const agreements = await prisma.rtoAgreement.findMany({ where: filter, include: { driver: true }, orderBy: { number: 'asc' }, ...pagination });
    headers = ['Car / agreement', 'Driver', 'Contact', 'Status', 'Start', 'Weekly rent'];
    rows = agreements.map(a => [agreementLink(a), a.driver.name, a.driver.phone, a.status, day(a.startDate), zar(a.weeklyAmount)]);
  } else if (section === 'payments') {
    const payments = await prisma.rtoPayment.findMany({ where: q ? { OR: [{ reference: { contains: q, mode: 'insensitive' } }, { agreement: { OR: filter.OR?.filter(item => !('payments' in item)) } }] } : {}, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Date', 'Reference', 'For', 'Total', 'Rent', 'Deposit', 'Status'];
    rows = payments.map(p => [agreementLink(p.agreement), day(p.date), p.reference, p.kind === 'WEEKLY' ? 'Weekly payment' : p.kind === 'UPFRONT' ? 'Deposit' : p.kind === 'RENT' ? 'Rent' : 'Other', zar(p.amount), zar(rentPart(p)), zar(depositPart(p)), p.reversedAt ? 'Reversed' : 'Recorded']);
  } else if (section === 'mileage') {
    const mileage = await prisma.rtoMileageEntry.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Date', 'Lifetime km', 'Distance km', 'Excess km', 'Review'];
    rows = mileage.map(m => [agreementLink(m.agreement), day(m.date), m.odometerKm, m.distanceKm, m.excessKm, m.reviewRequired ? 'Reconciliation required' : 'Recorded / reviewed']);
  } else if (section === 'repairs') {
    const repairs = await prisma.rtoRepair.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Date', 'Work', 'Workshop', 'Status', 'Invoice', 'Company', 'Driver'];
    rows = repairs.map(r => [agreementLink(r.agreement), day(r.date), r.description, r.workshop, r.status, zar(r.invoiceAmount), zar(r.companyAmount), zar(r.driverAmount)]);
  } else if (section === 'service') {
    const services = await prisma.rtoService.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Date', 'Work', 'Workshop', 'Status', 'Actual / target km', 'Company cost'];
    rows = services.map(s => [agreementLink(s.agreement), day(s.date), s.description, s.workshop, s.status, s.status === 'PLANNED' ? s.targetMileageKm : s.odometerKm, s.status === 'COMPLETED' ? zar(s.cost) : 'Not yet incurred']);
  } else if (section === 'downtime') {
    const downtime = await prisma.rtoDowntime.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { startsAt: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Unavailable from', 'Available again', 'Reason', 'Replacement'];
    rows = downtime.map(d => [agreementLink(d.agreement), day(d.startsAt), d.endsAt ? day(d.endsAt) : 'Open', d.reason, d.replacementVehicleId ?? 'None']);
  } else if (section === 'documents') {
    const documents = await prisma.rtoDocument.findMany({ where: { agreement: filter }, select: { id: true, title: true, kind: true, createdAt: true, agreement: { select: { id: true, number: true, vehicleId: true } } }, orderBy: { createdAt: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Document', 'Category', 'Added'];
    rows = documents.map(d => [agreementLink(d.agreement), <a key={d.id} className="underline" href={`/api/private-documents?scope=RTO&id=${d.id}`}>{d.title}</a>, d.kind, day(d.createdAt)]);
  } else if (section === 'settlements') {
    const settlements = await prisma.rtoSettlementReview.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { createdAt: 'desc' }, ...pagination });
    headers = ['Car / agreement', 'Reviewed', 'Indicative', 'Approved', 'Status', 'Basis'];
    rows = settlements.map(s => [agreementLink(s.agreement), day(s.createdAt), zar(s.indicativeAmount), s.approvedAmount ? zar(s.approvedAmount) : 'Pending', s.status, s.legalBasis]);
  } else if (section === 'alerts') {
    const alerts = (await getFleetNotifications()).filter(n => n.href.startsWith('/rent-to-own') && (!q || `${n.title} ${n.vehicleId}`.toLowerCase().includes(q.toLowerCase())));
    headers = ['Priority', 'Vehicle', 'Alert', 'Details'];
    rows = alerts.slice(pagination.skip, pagination.skip + 31).map(n => [n.priority, n.vehicleId, <Link prefetch={false} key={n.id} href={n.href} className="underline">{n.title}</Link>, n.description]);
  }
  const choices = ['payments', 'mileage', 'repairs', 'service', 'downtime', 'documents', 'settlements'].includes(section) ? await prisma.rtoAgreement.findMany({ where: filter, select: { id: true, number: true, vehicleId: true }, orderBy: { number: 'asc' }, take: 30 }) : [];
  const addAction: Record<string, string> = { payments: 'Add payment', mileage: 'Add mileage', repairs: 'Add repair', service: 'Add service cost', downtime: 'Add time off road', documents: 'Add document', settlements: 'Review early payoff' };
  const pageHref = (value: number) => `/rent-to-own/${section}?${new URLSearchParams({ q, page: String(value) })}`;
  return <>
    {section === 'mileage' && <div className="grid gap-3 lg:grid-cols-2">{[...new Set(choices.map(a => a.vehicleId))].map(id => <div key={id} className="min-w-0"><h2 className="font-semibold">{id}</h2><MonthlyMileage vehicleId={id} rto /></div>)}</div>}
    <ModuleHeader title={`Rent-to-Own · ${config[0]}`} description={config[1]} />
    {section === 'vehicles' && session.staffRole === 'ADMIN' && <form action="/rent-to-own/vehicles/new" method="get"><button className="mb-5 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-white">Add vehicle</button></form>}
    {section === 'reports' ? <div className="space-y-4">
      <form className="flex flex-wrap items-end gap-3"><label>From<input required type="date" name="from" defaultValue={historicalReport ? day(historicalReport.range.from) : ''} className="block rounded border bg-background p-2" /></label><label>To<input required type="date" name="to" defaultValue={historicalReport ? day(historicalReport.range.to) : ''} className="block rounded border bg-background p-2" /></label><button className="rounded bg-primary px-4 py-2 text-white">View report</button></form>
      {historicalReport && <><p>Rent collected {zar(historicalReport.collected)} · Total due at period end {zar(historicalReport.totalOutstanding)}</p><CollectionsChart title="Weekly rent expected and collected" data={historicalReport.weeklyChart} /><h2 className="text-xl font-semibold">Car performance</h2><p className="text-sm">Recorded rent less company repair shares and completed services in this period. Deposits are shown separately. This excludes finance, Fidelity and manager costs unless recorded elsewhere; it is not net profit.</p><DataTable headers={['Car', 'Rent received', 'Due at period end', 'Deposit left', 'Company repairs', 'Services', 'After these costs']} rows={historicalReport.rows.map(r => { const rent = sumMoney(r.payments.map(rentPart)); const repairs = sumMoney(r.repairs.map(x => x.companyAmount)); const services = sumMoney(r.services.map(x => x.cost)); return [r.vehicleId, zar(rent), zar(r.amountDue), zar(r.depositLeft), zar(repairs), zar(services), zar(rent.minus(repairs).minus(services))]; })} /></>}
      <div className="flex flex-wrap gap-4">{['agreements', 'payments', 'mileage', 'repairs'].map(type => <a key={type} className="capitalize underline" href={`/api/rent-to-own/export?${exportRange}&type=${type}`}>{type} CSV</a>)}</div>
    </div> : <>
      <form className="mb-5 flex flex-wrap gap-3"><input aria-label="Find a car or driver" name="q" defaultValue={q} placeholder="Car, driver, agreement or receipt" className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3" /><button className="rounded-lg bg-primary px-4 py-2 text-white">Search</button></form>
      {session.staffRole === 'ADMIN' && ['vehicles', 'agreements'].includes(section) && <Link prefetch={false} className="underline" href="/rent-to-own/manage">Create agreement or transfer a vehicle into Rent-to-Own</Link>}
      {section === 'payments' && <section className="mb-5 rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Deposit payments</h2><p className="mt-2 text-sm">Choose the car below. You can record the full R8,000 deposit upfront, or record the R650 deposit contribution together with each weekly rent payment until the deposit is paid.</p></section>}
      {choices.length > 0 && <AgreementPicker agreements={choices} tab={tab} canEdit={session.staffRole === 'ADMIN'} actionLabel={addAction[section]} />}
      <DataTable headers={headers} rows={rows.slice(0, 30)} empty="No records yet. Choose a car above to start." />
      <nav aria-label="Register pages" className="flex gap-4 text-sm">{page > 1 && <Link prefetch={false} href={pageHref(page - 1)}>Previous</Link>}<span>Page {page}</span>{rows.length > 30 && <Link prefetch={false} href={pageHref(page + 1)}>Next</Link>}</nav>
    </>}
  </>;
}
