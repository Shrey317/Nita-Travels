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
  vehicles: ['Vehicles', 'Vehicles currently assigned to Rent-to-Own, with their own agreements and operational history.'],
  agreements: ['Agreements & Drivers', 'Manage the driver relationship, contractual terms and agreement lifecycle.'],
  payments: ['Payments & Charges', 'Record payments and expenses manually when the driver pays. Nothing is marked as paid until you save a payment.'],
  mileage: ['Mileage', 'Weekly readings, allowances, excess kilometres and reviewed corrections.'],
  repairs: ['Repairs & Approvals', 'Quotations, approvals, invoices and the company/driver cost split.'],
  service: ['Scheduled Servicing', 'Plan maintenance, complete services and track company-paid costs.'],
  downtime: ['Downtime & Replacements', 'Unavailable periods, replacement reservations and extensions to agreement duration.'],
  documents: ['Documents', 'Private agreement documents and supporting evidence.'],
  settlements: ['Settlement Reviews', 'Reviewed settlement figures and legal approval records.'],
  alerts: ['Alerts', 'Service, mileage and availability alerts for Rent-to-Own only.'],
  reports: ['Reports', 'Rent-to-Own collections, obligations, mileage and repair exports.'],
};
export default async function RtoSection({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<{ page?: string; q?: string }> }) {
  const session = await requireSession();
  const { section } = await params; const config = sections[section]; if (!config) notFound();
  const query = await searchParams;
  const page = Math.max(1, Math.min(100000, Number.parseInt(query.page ?? '1', 10) || 1));
  const q = (query.q ?? '').trim().slice(0, 100);
  const filter = q ? { OR: [{ number: { contains: q, mode: 'insensitive' as const } }, { vehicleId: { contains: q, mode: 'insensitive' as const } }, { driver: { name: { contains: q, mode: 'insensitive' as const } } }] } : {};
  const pagination = { skip: (page - 1) * 30, take: 31 };
  const tab = ['vehicles', 'agreements'].includes(section) ? 'overview' : section === 'payments' ? 'entries' : section;
  const agreementLink = (a: { id: string; number: string; vehicleId: string }) => <Link prefetch={false} className="underline" href={`/rent-to-own/agreements/${a.id}?tab=${tab}`}>{a.vehicleId} · {a.number}</Link>;
  let headers: string[] = []; let rows: ReactNode[][] = [];
  if (section === 'vehicles') {
    const vehicles = await prisma.vehicle.findMany({ where: { deletedAt: null, assignments: { some: { module: 'RENT_TO_OWN', endsAt: null } }, ...(q ? { OR: [{ id: { contains: q, mode: 'insensitive' } }, { registration: { contains: q, mode: 'insensitive' } }] } : {}) }, select: { id: true, make: true, model: true, registration: true, currentMileageKm: true, availability: true, rtoAgreements: { orderBy: { createdAt: 'desc' }, select: { id: true, number: true, vehicleId: true, status: true } } }, orderBy: { id: 'asc' }, ...pagination });
    headers = ['Vehicle', 'Registration', 'Lifetime km', 'Availability', 'Agreements'];
    rows = vehicles.map(v => [`${v.id} · ${v.make} ${v.model}`, v.registration, v.currentMileageKm.toLocaleString(), v.availability, <div key={v.id} className="space-y-2">{v.rtoAgreements.map(a => <div key={a.id}>{agreementLink(a)} · {a.status}</div>)}</div>]);
  } else if (section === 'agreements') {
    const agreements = await prisma.rtoAgreement.findMany({ where: filter, include: { driver: true }, orderBy: { number: 'asc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Driver', 'Contact', 'Status', 'Start', 'Weekly rent'];
    rows = agreements.map(a => [agreementLink(a), a.driver.name, a.driver.phone, a.status, day(a.startDate), zar(a.weeklyAmount)]);
  } else if (section === 'payments') {
    const payments = await prisma.rtoPayment.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Date', 'Reference', 'Purpose', 'Amount', 'Status'];
    rows = payments.map(p => [agreementLink(p.agreement), day(p.date), p.reference, p.kind, zar(p.amount), p.reversedAt ? 'Reversed' : 'Recorded']);
  } else if (section === 'mileage') {
    const mileage = await prisma.rtoMileageEntry.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Date', 'Lifetime km', 'Distance km', 'Excess km', 'Review'];
    rows = mileage.map(m => [agreementLink(m.agreement), day(m.date), m.odometerKm, m.distanceKm, m.excessKm, m.reviewRequired ? 'Reconciliation required' : 'Recorded / reviewed']);
  } else if (section === 'repairs') {
    const repairs = await prisma.rtoRepair.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Date', 'Work', 'Workshop', 'Status', 'Invoice', 'Company', 'Driver'];
    rows = repairs.map(r => [agreementLink(r.agreement), day(r.date), r.description, r.workshop, r.status, zar(r.invoiceAmount), zar(r.companyAmount), zar(r.driverAmount)]);
  } else if (section === 'service') {
    const services = await prisma.rtoService.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { date: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Date', 'Work', 'Workshop', 'Status', 'Actual / target km', 'Company cost'];
    rows = services.map(s => [agreementLink(s.agreement), day(s.date), s.description, s.workshop, s.status, s.status === 'PLANNED' ? s.targetMileageKm : s.odometerKm, s.status === 'COMPLETED' ? zar(s.cost) : 'Not yet incurred']);
  } else if (section === 'downtime') {
    const downtime = await prisma.rtoDowntime.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { startsAt: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Unavailable from', 'Available again', 'Reason', 'Replacement'];
    rows = downtime.map(d => [agreementLink(d.agreement), day(d.startsAt), d.endsAt ? day(d.endsAt) : 'Open', d.reason, d.replacementVehicleId ?? 'None']);
  } else if (section === 'documents') {
    const documents = await prisma.rtoDocument.findMany({ where: { agreement: filter }, select: { id: true, title: true, kind: true, createdAt: true, agreement: { select: { id: true, number: true, vehicleId: true } } }, orderBy: { createdAt: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Document', 'Category', 'Added'];
    rows = documents.map(d => [agreementLink(d.agreement), <a key={d.id} className="underline" href={`/api/private-documents?scope=RTO&id=${d.id}`}>{d.title}</a>, d.kind, day(d.createdAt)]);
  } else if (section === 'settlements') {
    const settlements = await prisma.rtoSettlementReview.findMany({ where: { agreement: filter }, include: { agreement: true }, orderBy: { createdAt: 'desc' }, ...pagination });
    headers = ['Agreement / vehicle', 'Reviewed', 'Indicative', 'Approved', 'Status', 'Basis'];
    rows = settlements.map(s => [agreementLink(s.agreement), day(s.createdAt), zar(s.indicativeAmount), s.approvedAmount ? zar(s.approvedAmount) : 'Pending', s.status, s.legalBasis]);
  } else if (section === 'alerts') {
    const alerts = (await getFleetNotifications()).filter(n => n.href.startsWith('/rent-to-own') && (!q || `${n.title} ${n.vehicleId}`.toLowerCase().includes(q.toLowerCase())));
    headers = ['Priority', 'Vehicle', 'Alert', 'Details'];
    rows = alerts.slice(pagination.skip, pagination.skip + 31).map(n => [n.priority, n.vehicleId, <Link prefetch={false} key={n.id} href={n.href} className="underline">{n.title}</Link>, n.description]);
  }
  const choices = ['payments','mileage','repairs','service','downtime','documents','settlements'].includes(section) ? await prisma.rtoAgreement.findMany({ where: filter, select: { id: true, number: true, vehicleId: true }, orderBy: { number: 'asc' }, take: 30 }) : [];
  const pageHref = (value: number) => `/rent-to-own/${section}?${new URLSearchParams({ q, page: String(value) })}`;
  return <>
    <ModuleHeader title={`Rent-to-Own · ${config[0]}`} description={config[1]} />
    {section === 'vehicles' && session.staffRole === 'ADMIN' && <Link className="mb-5 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-white" href="/rent-to-own/vehicles/new">Add car</Link>}
    {section === 'reports' ? <div className="grid gap-4 sm:grid-cols-2"><Link prefetch={false} className="rounded-xl border border-border p-5 underline" href="/rent-to-own">Dashboard, date filters & financial charts</Link>{['agreements','payments','mileage','repairs'].map(type => <a key={type} className="rounded-xl border border-border p-5 capitalize underline" href={`/api/rent-to-own/export?type=${type}`}>{type} CSV export (current month)</a>)}</div> : <>
      <form className="mb-5 flex flex-wrap gap-3"><input aria-label="Search this RTO register" name="q" defaultValue={q} placeholder="Search vehicle, driver or agreement" className="min-w-0 flex-1 rounded-lg border border-border bg-background p-3" /><button className="rounded-lg bg-primary px-4 py-2 text-white">Search</button></form>
      {session.staffRole === 'ADMIN' && ['vehicles','agreements'].includes(section) && <Link prefetch={false} className="underline" href="/rent-to-own/manage">Create agreement or transfer a vehicle into Rent-to-Own</Link>}
      {choices.length > 0 && <AgreementPicker agreements={choices} tab={tab} canEdit={session.staffRole === 'ADMIN'} />}
      <DataTable headers={headers} rows={rows.slice(0, 30)} empty="No Rent-to-Own records in this register yet. Choose an agreement above to get started." />
      <nav aria-label="Register pages" className="flex gap-4 text-sm">{page > 1 && <Link prefetch={false} href={pageHref(page - 1)}>Previous</Link>}<span>Page {page}</span>{rows.length > 30 && <Link prefetch={false} href={pageHref(page + 1)}>Next</Link>}</nav>
    </>}
  </>;
}
