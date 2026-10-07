"use client";

import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/empty-state";
import { FileText } from "lucide-react";
import { FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";
import type { VehicleNote } from "@prisma/client";

/** SRS 15.9: ALLCR rows show "All Vehicles" under Registration; null rows show "—". */
function registrationLabel(vehicleId: string | null, vehicles: { id: string; registration: string }[]): string {
  if (!vehicleId) return "—";
  if (vehicleId === FLEET_WIDE_VEHICLE_ID) return "All Vehicles";
  return vehicles.find((v) => v.id === vehicleId)?.registration ?? vehicleId;
}

interface NotesTableProps {
  notes: VehicleNote[];
  vehicles: { id: string; registration: string }[];
}

/** Delete only — no edit path exists for notes (SRS 11, 26). */
export function NotesTable({ notes, vehicles }: NotesTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't delete this note.");
    }
    window.dispatchEvent(new Event("fleet-data-changed"));
    router.refresh();
  }

  if (notes.length === 0) {
    return (
      <EmptyState
        title="No notes yet"
        description="There are no notes that match your filters."
        icon={FileText}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-surface-elevated/50">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Date</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Vehicle</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Registration</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Note</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-subtle">
          {notes.map((n) => (
            <TableRow key={n.id} id={`note-${n.id}`} className="hover:bg-surface-elevated/50 transition-colors scroll-mt-24 target:bg-primary/10">
              <TableCell className="whitespace-nowrap text-ink-secondary">{formatDate(n.date)}</TableCell>
              <TableCell className="font-bold text-white">{n.vehicleId ?? "—"}</TableCell>
              <TableCell className="text-ink-secondary">{registrationLabel(n.vehicleId, vehicles)}</TableCell>
              <TableCell className="min-w-72 max-w-lg break-words">
                <p className="whitespace-pre-wrap text-ink-secondary leading-relaxed">{n.note}</p>
                <PhotoThumbnails urls={n.photoUrls} label={`Note file for ${registrationLabel(n.vehicleId, vehicles)} on ${formatDate(n.date)}`} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <DeleteConfirmDialog
                    title="Delete this note?"
                    description="This permanently removes the note. This can't be undone."
                    onDelete={() => handleDelete(n.id)}
                    successMessage="Note deleted"
                    triggerLabel="Delete note"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
