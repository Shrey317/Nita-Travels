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
    window.dispatchEvent(new Event("fleet-data-changed"));
    router.refresh();
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-subtle bg-card p-8 text-center text-sm text-ink-secondary">
        No mileage entries match these filters.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-card overflow-x-auto shadow-card-elevated">
      <Table className="min-w-[1100px] [&_td]:whitespace-nowrap">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-surface-elevated/50">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Date</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Vehicle</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Reg</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Previous KM</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Current KM</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Distance</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Week</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Limit</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Rem</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Util %</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Status</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-subtle">
          {entries.map((e) => (
            <TableRow key={e.id} id={`mileage-${e.id}`} className="hover:bg-surface-elevated/50 transition-colors scroll-mt-24 target:bg-primary/10">
              <TableCell className="whitespace-nowrap text-ink-secondary">{formatDate(e.date)}</TableCell>
              <TableCell className="font-bold text-white">{e.vehicleId}</TableCell>
              <TableCell className="text-ink-secondary">{e.vehicle.registration}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatKm(e.previousMileageKm)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-white">{formatKm(e.currentMileageKm)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-white">{formatKm(e.distanceDrivenKm)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted">
                W{e.isoWeek}-{e.isoYear}
              </TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatKm(e.weeklyLimitKm)}</TableCell>
              <TableCell className="text-right font-mono-figures text-sm">
                {e.overLimitByKm !== null ? 
                  <span className="text-error font-semibold">- {formatKm(e.overLimitByKm)}</span> : 
                  <span className="text-status-success">{formatKm(e.weeklyLimitKm - e.distanceDrivenKm)}</span>
                }
              </TableCell>
              <TableCell className="text-right font-mono-figures text-sm">
                <span className={e.distanceDrivenKm > e.weeklyLimitKm ? "text-error font-semibold" : "text-ink-secondary"}>
                  {Math.round((e.distanceDrivenKm / e.weeklyLimitKm) * 100)}%
                </span>
              </TableCell>
              <TableCell>
                {e.overLimitByKm !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-error/10 border border-error/20 px-2 py-0.5 text-[11px] font-semibold text-error">⚠ OVER BY {e.overLimitByKm.toLocaleString()} km</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 border border-status-success/20 px-2 py-0.5 text-[11px] font-semibold text-status-success">✅ Within Limit</span>
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
    </div>
  );
}

