export const dynamic = "force-dynamic";
import Link from "next/link";
import { getReplacementReview } from "@/lib/db/analytics";
import { formatZAR, formatKm } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

export default async function ReplacementPage() {
  const rows = await getReplacementReview();
  return <div className="space-y-6"><PageHeader title="Replacement Review" description="Evidence for management review. No automatic replacement decisions." />
    <p className="rounded-card border bg-card p-4 text-sm text-muted">Review factors retain the existing mileage, age, repair-to-revenue and ROI thresholds. They are screening rules, not a valuation or mechanical assessment. Lifetime figures include recorded transactions; 90-day repair comparisons are shown separately.</p>
    <div className="space-y-4">{rows.map(row => <article key={row.vehicle.id} className="rounded-card border bg-card p-5 space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><Link href={`/vehicles/${row.vehicle.id}`} className="text-lg font-semibold text-teal hover:underline">{row.vehicle.id} · {row.vehicle.registration}</Link><p className="text-sm text-muted">{row.vehicle.make} {row.vehicle.model} · {row.ageYears.toFixed(1)} years since purchase · {formatKm(row.vehicle.currentMileageKm)}</p></div><Badge variant={row.factors.length ? "warning" : "secondary"}>{row.factors.length ? `${row.factors.length} review factors detected` : "No threshold factors detected"}</Badge></div>
      {row.factors.length > 0 && <ul className="list-disc pl-5 text-sm space-y-1">{row.factors.map(factor => <li key={factor}>{factor}</li>)}</ul>}
      <Table><TableHeader><TableRow><TableHead>Lifetime revenue</TableHead><TableHead>Lifetime expenses</TableHead><TableHead>Lifetime profit</TableHead><TableHead>Repair records</TableHead><TableHead>Repairs last 90 days</TableHead><TableHead>Prior 90 days</TableHead><TableHead>Maintenance/km</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>{formatZAR(row.incomeCents)}</TableCell><TableCell>{formatZAR(row.expenseCents)}</TableCell><TableCell>{formatZAR(row.netProfitCents)}</TableCell><TableCell>{row.repairCount}</TableCell><TableCell>{formatZAR(row.recentRepairCents)}</TableCell><TableCell>{formatZAR(row.priorRepairCents)}</TableCell><TableCell>{row.maintenancePerKmCents === null ? "—" : formatZAR(row.maintenancePerKmCents)}</TableCell></TableRow></TableBody></Table>
      <details className="rounded-input bg-surface-secondary p-3"><summary className="cursor-pointer text-sm font-medium">Ownership cost and finance evidence</summary><dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">{[
        ["Purchase price", formatZAR(row.ownership.purchasePriceCents)], ["Recorded ledger expenses", formatZAR(row.ownership.recordedOperatingCents)],
        ["Purchase + recorded expenses", formatZAR(row.ownership.totalCostCents)], ["Revenue less this cost basis", formatZAR(row.ownership.netContributionCents)],
        ["Configured monthly EMI", formatZAR(row.vehicle.targetEmiCents)], ["EMI months recorded paid", `${row.vehicle.emiMonthsPaid} / ${row.vehicle.emiMonthsTotal}`],
      ].map(([label, value]) => <div key={label}><dt className="text-muted">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl><p className="mt-3 text-xs leading-relaxed text-muted">Partial ownership cost: includes purchase and all recorded expenses (service, repairs, licensing and other categories). Configured premiums and EMI are not assumed to have been paid. Finance principal recorded in Other may overlap purchase price; reconcile those entries before treating this as complete TCO. Depreciation, resale value, downtime and financing interest are not available.</p></details>
    </article>)}</div>
    {!rows.length && <p className="text-muted">No vehicle records are available.</p>}
  </div>;
}
