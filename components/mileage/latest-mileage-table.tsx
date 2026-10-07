import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatKm, formatDate } from "@/lib/format";

type LatestMileageRow = {
  id: string;
  registration: string;
  currentMileageKm: number;
  mileageEntries: { date: Date }[];
};

export function LatestMileageTable({ vehicles }: { vehicles: LatestMileageRow[] }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold tracking-tight text-white">Latest Mileage (Active Fleet)</h3>
      <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-surface-elevated/50">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Vehicle</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Registration</TableHead>
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Latest KM</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border-subtle">
            {vehicles.map((v) => (
              <TableRow key={v.id} className="hover:bg-surface-elevated/50 transition-colors">
                <TableCell className="font-bold text-white">{v.id}</TableCell>
                <TableCell className="text-ink-secondary">{v.registration}</TableCell>
                <TableCell className="text-right font-mono-figures text-sm text-white">
                  {formatKm(v.currentMileageKm)}
                </TableCell>
                <TableCell>
                  {v.mileageEntries[0]?.date ? (
                    <span className="text-ink-secondary">{formatDate(v.mileageEntries[0].date)}</span>
                  ) : (
                    <span className="text-muted text-sm">No entries</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
