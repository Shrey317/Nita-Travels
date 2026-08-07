import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { formatDate, formatZAR, formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/lib/db/vehicles";

/** SRS 13.8: Transaction rows show their category as Type; VehicleNote rows show "📝 Note" with
 *  a yellow tint and no income/expense figures; Service rows get a mileage sub-line. */
export function ActivityTimelineTable({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No activity in this range yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Income (R)</TableHead>
          <TableHead className="text-right">Expense (R)</TableHead>
          <TableHead>Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className={cn(item.isNote && "!bg-[var(--note-bg)] hover:!bg-[var(--note-bg)]")}
          >
            <TableCell className="whitespace-nowrap">{formatDate(item.date)}</TableCell>
            <TableCell>{item.isNote ? "📝 Note" : item.type}</TableCell>
            <TableCell className="text-right font-mono text-sm">
              {item.incomeCents ? formatZAR(item.incomeCents) : "—"}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {item.expenseCents ? formatZAR(item.expenseCents) : "—"}
            </TableCell>
            <TableCell className="max-w-md">
              <p className="whitespace-pre-wrap">{item.details || "—"}</p>
              {!item.isNote && item.type === "Service" && item.mileageKm !== null && (
                <p className="mt-1 text-xs text-muted">Mileage at service: {formatKm(item.mileageKm)}</p>
              )}
              <PhotoThumbnails
                urls={item.photoUrls}
                label={`${item.isNote ? "Note" : item.type} file from ${formatDate(item.date)}`}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
