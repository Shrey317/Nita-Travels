export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/client";
import { NoteForm } from "@/components/notes/note-form";
import { notFound } from "next/navigation";

export default async function NewVehicleNotePage({ params }: { params: { id: string } }) {
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true, deletedAt: null },
    select: { id: true, registration: true },
    orderBy: { id: "asc" },
  });

  const vehicleExists = vehicles.some((v) => v.id === params.id);
  if (!vehicleExists) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Note for {params.id}</h1>
        <p className="text-sm text-muted">Record driver changes, accidents, or general vehicle news.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <NoteForm vehicles={vehicles} initialVehicleId={params.id} />
      </div>
    </div>
  );
}
