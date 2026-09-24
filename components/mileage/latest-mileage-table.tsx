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
      <h3 className="text-lg font-semibold tracking-tight">Latest Mileage (Active Fleet)</h3>
      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Vehicle</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead className="text-right">Latest KM</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.id}</TableCell>
                <TableCell>{v.registration}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatKm(v.currentMileageKm)}
                </TableCell>
                <TableCell>
                  {v.mileageEntries[0]?.date ? (
                    formatDate(v.mileageEntries[0].date)
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
