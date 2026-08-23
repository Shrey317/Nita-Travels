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
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead>Note</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notes.map((n) => (
          <TableRow key={n.id} className="!bg-[var(--note-bg)] hover:!bg-[var(--note-bg)]">
            <TableCell className="whitespace-nowrap">{formatDate(n.date)}</TableCell>
            <TableCell>{n.vehicleId ?? "—"}</TableCell>
            <TableCell>{registrationLabel(n.vehicleId, vehicles)}</TableCell>
            <TableCell className="max-w-lg">
              <p className="whitespace-pre-wrap">{n.note}</p>
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
  );
}
