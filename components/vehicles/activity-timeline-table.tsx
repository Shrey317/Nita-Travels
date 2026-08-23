import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { PhotoThumbnails } from "@/components/shared/photo-thumbnails";
import { formatDate, formatZAR, formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FileText, Wrench, Fuel, ShieldAlert, FileDigit, Settings, DollarSign, PenSquare } from "lucide-react";
import type { TimelineItem } from "@/lib/db/vehicles";

function getTypeConfig(type: string, isNote: boolean) {
  if (isNote) return { icon: PenSquare, color: "bg-status-warning/10 text-status-warning", label: "Note" };
  
  switch (type.toLowerCase()) {
    case "service": return { icon: Settings, color: "bg-brand-blue/10 text-brand-blue", label: "Service" };
    case "repair": return { icon: Wrench, color: "bg-status-error/10 text-status-error", label: "Repair" };
    case "fuel": return { icon: Fuel, color: "bg-status-success/10 text-status-success", label: "Fuel" };
    case "insurance": return { icon: ShieldAlert, color: "bg-status-info/10 text-status-info", label: "Insurance" };
    case "toll": return { icon: FileDigit, color: "bg-slate-500/10 text-slate-500", label: "Toll" };
    case "document": return { icon: FileText, color: "bg-slate-500/10 text-slate-500", label: "Document" };
    default: return { icon: DollarSign, color: "bg-slate-500/10 text-slate-500", label: type };
  }
}

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
            className={cn("group hover:bg-surface-secondary/50 transition-colors", item.isNote && "bg-notebg/50 hover:bg-notebg/80")}
          >
            <TableCell className="whitespace-nowrap font-medium text-ink/80">{formatDate(item.date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", getTypeConfig(item.type, item.isNote).color)}>
                  {(() => {
                    const Icon = getTypeConfig(item.type, item.isNote).icon;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </span>
                <span className="text-sm font-medium">{getTypeConfig(item.type, item.isNote).label}</span>
              </div>
            </TableCell>
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
