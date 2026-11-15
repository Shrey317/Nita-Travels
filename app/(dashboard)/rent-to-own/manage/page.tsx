import Link from 'next/link';
import { requireAdmin } from '@/lib/api-response';
import { prisma } from '@/lib/db/client';
import { ActionForm } from '@/components/fleet-expansion/action-form';
import { DataTable, ModuleHeader, ModuleLinks, day } from '@/components/fleet-expansion/presentation';
export const dynamic = 'force-dynamic';
export default async function ManageRto() {
  await requireAdmin();
  const [vehicles, drivers, transfers, assignments] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true, deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: 'asc' } }),
    prisma.rtoDriver.findMany({ orderBy: { name: 'asc' } }),
    prisma.vehicleTransfer.findMany({ orderBy: { effectiveAt: 'desc' }, take: 100 }),
    prisma.vehicleAssignment.findMany({ where: { endsAt: null } }),
  ]);
  const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.id} · ${v.registration} · ${assignments.find(a => a.vehicleId === v.id)?.module ?? 'NORMAL_RENTAL'}` }));
  return <><ModuleLinks /><ModuleHeader title="Add a driver or agreement" description="Add the car, add the driver, then link them with an agreement. Open the agreement to upload the signed copy and start it." />
    <div className="space-y-4">
      <Link className="inline-block rounded-lg bg-primary px-4 py-3 text-white" href="/rent-to-own/vehicles/new">Add car</Link>
      <ActionForm title="Update physical availability" endpoint="/api/rent-to-own/availability" description="Physical condition is independent of the operating module. Open downtime and replacement reservations must be resolved through their own workflow." fields={[{ name: 'vehicleId', label: 'Vehicle', options: vehicleOptions }, { name: 'availability', label: 'Physical availability', options: ['AVAILABLE','MAINTENANCE','UNAVAILABLE','DISPOSED'].map(value => ({ value, label: value })) }, { name: 'reason', label: 'Reason / authorisation' }]} />
      <ActionForm title="1. Add driver" endpoint="/api/rent-to-own/drivers" fields={[{ name: 'name', label: 'Full name' }, { name: 'phone', label: 'Phone' }, { name: 'email', label: 'Email', type: 'email', optional: true }, { name: 'licenceReference', label: 'Driving licence reference' }]} />
      <ActionForm title="2. Move an existing car" endpoint="/api/rent-to-own/transfer" description="Confirm the prior agreement has been lawfully resolved. This records an immutable handover and preserves every prior module record." fields={[
        { name: 'vehicleId', label: 'Vehicle', options: vehicleOptions }, { name: 'toModule', label: 'Destination', options: ['RENT_TO_OWN', 'NORMAL_RENTAL', 'UNASSIGNED'].map(value => ({ value, label: value.replaceAll('_', ' ') })) },
        { name: 'effectiveAt', label: 'Effective date', type: 'date' }, { name: 'odometerKm', label: 'Final handover odometer (km)', type: 'number' }, { name: 'condition', label: 'Vehicle condition' }, { name: 'resolution', label: 'Prior agreement resolution / handover confirmation' },
      ]} />
      <ActionForm successHref="/rent-to-own/agreements" title="3. Add agreement" endpoint="/api/rent-to-own/agreements" description="Suzuki S-Presso standard weekly amounts: 2023–2024 R2,650; 2025+ R2,850. Review the actual contractual amount below. Upload the signed agreement to start. The R8,000 deposit is paid with rent: R650 a week, then R200 in the last week." fields={[
        { name: 'number', label: 'Agreement number' }, { name: 'vehicleId', label: 'Vehicle', options: vehicleOptions }, { name: 'driverId', label: 'Driver', options: drivers.map(d => ({ value: d.id, label: d.name })) },
        { name: 'modelYear', label: 'Model year', type: 'number', value: 2025 }, { name: 'weeklyAmount', label: 'Weekly amount (R)', value: '2850.00' }, { name: 'upfrontRequired', label: 'Total deposit (R)', value: '8000.00' }, { name: 'weeks', label: 'Weeks', type: 'number', value: 234 }, { name: 'startDate', label: 'Start date', type: 'date' },
      ]} />
    </div>
    <h2 className="mt-8 text-xl font-semibold">Driver register</h2><DataTable headers={['Name', 'Phone', 'Email', 'Licence reference']} rows={drivers.map(d => [d.name, d.phone, d.email ?? '—', d.licenceReference])} />
    <h2 className="mt-8 text-xl font-semibold">Transfer history</h2><DataTable headers={['Vehicle', 'From', 'To', 'Effective', 'Odometer', 'Condition', 'Resolution']} rows={transfers.map(t => [t.vehicleId, t.fromModule, t.toModule, day(t.effectiveAt), t.odometerKm, t.condition, t.resolution])} />
  </>;
}
