import { VehicleForm } from "@/components/vehicles/vehicle-form";

export default function NewVehiclePage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Vehicle</h1>
        <p className="text-sm text-muted">Add a new vehicle to the fleet register.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <VehicleForm />
      </div>
    </div>
  );
}
