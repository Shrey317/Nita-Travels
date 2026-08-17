"use client";

import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { EditMileageDialog } from "@/components/mileage/edit-mileage-dialog";
import { formatDate, formatKm } from "@/lib/format";
import type { MileageEntry } from "@prisma/client";

type MileageRow = MileageEntry & { vehicle: { registration: string } };

/** SRS 15.8: ✅ Within Limit (green) or ⚠ OVER LIMIT BY X km (red, bold). */
export function MileageTable({ entries }: { entries: MileageRow[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    const res = await fetch(`/api/mileage/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't delete this entry.");
    }
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No mileage entries match these filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Reg</TableHead>
          <TableHead className="text-right">Previous KM</TableHead>
          <TableHead className="text-right">Current KM</TableHead>
          <TableHead className="text-right">Distance</TableHead>
          <TableHead>Week</TableHead>
          <TableHead className="text-right">Limit</TableHead>
          <TableHead className="text-right">Rem</TableHead>
          <TableHead className="text-right">Util %</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="whitespace-nowrap">{formatDate(e.date)}</TableCell>
            <TableCell>{e.vehicleId}</TableCell>
            <TableCell>{e.vehicle.registration}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(e.previousMileageKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(e.currentMileageKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(e.distanceDrivenKm)}</TableCell>
            <TableCell className="whitespace-nowrap text-sm text-muted">
              W{e.isoWeek}-{e.isoYear}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(e.weeklyLimitKm)}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {e.overLimitByKm !== null ? 
                <span className="text-status-red">- {formatKm(e.overLimitByKm)}</span> : 
                <span className="text-status-green">{formatKm(e.weeklyLimitKm - e.distanceDrivenKm)}</span>
              }
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              <span className={e.distanceDrivenKm > e.weeklyLimitKm ? "text-status-red font-semibold" : ""}>
                {Math.round((e.distanceDrivenKm / e.weeklyLimitKm) * 100)}%
              </span>
            </TableCell>
            <TableCell>
              {e.overLimitByKm !== null ? (
                <span className="font-semibold text-status-red">⚠ OVER BY {e.overLimitByKm.toLocaleString()} km</span>
              ) : (
                <span className="text-status-green">✅ Within Limit</span>
              )}
              <PhotoThumbnails urls={e.photoUrls} label={`Odometer photo for ${e.vehicle.registration} on ${formatDate(e.date)}`} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <EditMileageDialog
                  entryId={e.id}
                  vehicleId={e.vehicleId}
                  currentMileageKm={e.currentMileageKm}
                  previousMileageKm={e.previousMileageKm}
                  onSaved={() => router.refresh()}
                />
                <DeleteConfirmDialog
                  title="Delete this mileage entry?"
                  description={`This permanently removes the ${formatDate(e.date)} entry for ${e.vehicleId}. This can't be undone.`}
                  onDelete={() => handleDelete(e.id)}
                  successMessage="Mileage entry deleted"
                  triggerLabel="Delete mileage entry"
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

