import Link from 'next/link';
import { requireAdmin } from '@/lib/api-response';
import { ActionForm } from '@/components/fleet-expansion/action-form';
import { ModuleHeader } from '@/components/fleet-expansion/presentation';
export default async function NewRtoVehiclePage() {
  await requireAdmin();
  return <div className="mx-auto max-w-3xl"><Link className="mb-5 block text-sm underline" href="/rent-to-own/vehicles">← Back to RTO vehicles</Link><ModuleHeader title="Add Rent-to-Own car" description="Add the car now. You can assign a driver and agreement afterwards." />
      <ActionForm title="Save car" initiallyOpen successHref="/rent-to-own/vehicles" endpoint="/api/rent-to-own/vehicles" description="Creates a permanent vehicle directly in Rent-to-Own. For an existing fleet car, use Transfer vehicle instead." fields={[
        { name: 'id', label: 'Vehicle ID (for example RT01)' }, { name: 'make', label: 'Make', value: 'Suzuki' }, { name: 'model', label: 'Model', value: 'S-Presso' }, { name: 'registration', label: 'Registration' }, { name: 'transmission', label: 'Transmission', options: [{ value: 'Manual', label: 'Manual' }, { value: 'Auto', label: 'Auto' }] }, { name: 'purchaseDate', label: 'Purchase date', type: 'date' }, { name: 'purchasePrice', label: 'Purchase price (R)' }, { name: 'mileageAtPurchaseKm', label: 'Mileage at purchase (km)', type: 'number' }, { name: 'currentMileageKm', label: 'Current lifetime mileage (km)', type: 'number' }, { name: 'serviceIntervalKm', label: 'Service interval (km)', type: 'number', value: 15000 },
      ]} />
  </div>;
}
