import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { formatDate, formatZAR, formatKm, formatMonthKey, formatVehicleLabel } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

/** Read-only filtered view: Transactions WHERE category IN (Repairs, BrakePads, Tyres) — SRS 15.7. */
export function RepairsTable({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No repairs match these filters.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Cost (R)</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Mileage (km)</TableHead>
          <TableHead>Month</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
            <TableCell>{formatVehicleLabel(t.vehicleId)}</TableCell>
            <TableCell>{CATEGORY_LABELS[t.category] ?? t.category}</TableCell>
            <TableCell className="text-right font-mono text-sm">{formatZAR(t.expenseZarCents)}</TableCell>
            <TableCell className="max-w-xs">
              <p className="truncate" title={t.notes ?? undefined}>
                {t.notes ?? "—"}
              </p>
              <PhotoThumbnails urls={t.photoUrls} />
            </TableCell>
            <TableCell className="text-right font-mono text-sm">{formatKm(t.mileageKm)}</TableCell>
            <TableCell className="whitespace-nowrap text-sm text-muted">{formatMonthKey(t.date)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
