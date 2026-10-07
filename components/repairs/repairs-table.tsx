import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { formatDate, formatZAR, formatKm, formatMonthKey, formatVehicleLabel } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/empty-state";
import { Wrench } from "lucide-react";
import type { Transaction } from "@prisma/client";

/** Read-only filtered view: Transactions WHERE category IN (Repairs, BrakePads, Tyres) — SRS 15.7. */
export function RepairsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No repairs"
        description="No repair logs match these filters."
        icon={Wrench}
      />
    );
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-surface-elevated/50">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Date</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Vehicle</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Category</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Cost (R)</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Description</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Mileage (km)</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Month</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-subtle">
          {transactions.map((t) => (
            <TableRow key={t.id} className="hover:bg-surface-elevated/50 transition-colors">
              <TableCell className="whitespace-nowrap text-ink-secondary">{formatDate(t.date)}</TableCell>
              <TableCell className="font-bold text-white">{formatVehicleLabel(t.vehicleId)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-ink-secondary border border-border-subtle">
                  {CATEGORY_LABELS[t.category] ?? t.category}
                </span>
              </TableCell>
              <TableCell className="text-right font-mono-figures text-sm font-semibold text-error">{formatZAR(t.expenseZarCents)}</TableCell>
              <TableCell className="max-w-xs">
                <p className="truncate text-ink-secondary" title={t.notes ?? undefined}>
                  {t.notes ?? "—"}
                </p>
                <PhotoThumbnails
                  urls={t.photoUrls}
                  label={`${CATEGORY_LABELS[t.category] ?? t.category} file for ${formatVehicleLabel(t.vehicleId)} on ${formatDate(t.date)}`}
                />
              </TableCell>
              <TableCell className="text-right font-mono-figures text-sm text-ink-secondary">{formatKm(t.mileageKm)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted">{formatMonthKey(t.date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
