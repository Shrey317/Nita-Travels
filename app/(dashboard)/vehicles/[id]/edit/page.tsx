import { notFound } from "next/navigation";
import { ensureVehicleFinanceColumns, prisma } from "@/lib/db/client";
import { requireSession } from "@/lib/api-response";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { redactLegacyFinance } from '@/lib/private-finance';

export const dynamic = "force-dynamic";

export default async function EditVehiclePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await requireSession();

  await ensureVehicleFinanceColumns();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Edit {vehicle.id}</h1>
        <p className="text-sm text-muted">
          {vehicle.make} {vehicle.model} — {vehicle.registration}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <VehicleForm vehicle={session.staffRole === 'ADMIN' ? vehicle : redactLegacyFinance(vehicle)} canEditFinance={session.staffRole === 'ADMIN'} />
      </div>
    </div>
  );
}
