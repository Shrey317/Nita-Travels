import Link from "next/link";
import type { AnalyticsReport } from "@/lib/db/analytics";
import { formatZAR, formatKm, formatDate } from "@/lib/format";
import { managementInsights } from "@/lib/intelligence";
import { VehicleComparison } from "@/components/analytics/vehicle-comparison";
import { ProfitBridge } from "@/components/analytics/profit-bridge";
import { PeriodTrendChart } from "@/components/analytics/period-trend-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

export function AnalyticsContent({ report }: { report: AnalyticsReport }) {
  const { current } = report;
  const insights = managementInsights(report);
  const maintenanceCards = [
    ["Repairs", formatZAR(current.totals.repairsCents)], ["Services", formatZAR(current.totals.serviceCents)],
    ["Total maintenance", formatZAR(current.totals.maintenanceCents)], ["Maintenance / km", current.totals.maintenancePerKmCents === null ? "—" : formatZAR(current.totals.maintenancePerKmCents)],
    ["Repair records", String(current.maintenance.repairCount)], ["Service records", String(current.maintenance.serviceCount)],
    ["Average repair", current.maintenance.averageRepairCents === null ? "—" : formatZAR(current.maintenance.averageRepairCents)],
  ];
  return <div className="space-y-8">
    <section id="overview" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Management insights</h2>
      <div className="grid gap-3 md:grid-cols-2">{insights.map(row => <Link href={row.href} key={row.title} className="rounded-card border bg-card p-4 hover:border-teal"><h3 className="text-sm font-semibold">{row.title}</h3><p className="mt-1 text-sm leading-relaxed text-muted">{row.evidence}</p></Link>)}</div>
    </section>
    <ProfitBridge report={report} />
    <section id="financial" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Expense composition</h2>
      <Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Records</TableHead></TableRow></TableHeader><TableBody>
        {current.categories.map(row => <TableRow key={row.category}><TableCell><Link className="text-teal hover:underline" href={`${report.sourceHref}&category=${row.category}`}>{row.category}</Link></TableCell><TableCell className="text-right">{formatZAR(row.incomeCents)}</TableCell><TableCell className="text-right">{formatZAR(row.expenseCents)}</TableCell><TableCell className="text-right">{row.count}</TableCell></TableRow>)}
        {!current.categories.length && <TableRow><TableCell colSpan={4}>No transactions found for this period. <Link href="/transactions/new" className="text-teal underline">Add a transaction</Link></TableCell></TableRow>}
      </TableBody></Table>
      <p className="text-sm text-muted">Fixed (licensing): {formatZAR(current.totals.fixedCents)} · Variable operating categories: {formatZAR(current.totals.variableCents)} · Unclassified: {formatZAR(current.totals.unclassifiedCents)}. Insurance and finance stored in free-text notes are not automatically classified.</p>
    </section>
    <section id="vehicles" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Vehicle performance</h2><VehicleComparison rows={current.vehicles} />
      <p className="text-sm text-muted">Fleet-wide, unassigned and unavailable-vehicle records: revenue {formatZAR(current.unallocated.incomeCents)}, expenses {formatZAR(current.unallocated.expenseCents)}, net contribution {formatZAR(current.unallocated.netProfitCents)}. These amounts are included in fleet totals, never arbitrarily allocated to vehicles.</p>
    </section>
    <section id="maintenance" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Maintenance intelligence</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{maintenanceCards.map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs font-medium text-muted">{label}</p><p className="mt-1 text-xl font-semibold font-mono-figures">{value}</p></CardContent></Card>)}</div>
      <p className="text-xs text-muted">Maintenance includes Repairs, Brake Pads, Tyres, Service and Maintenance transactions. Frequencies count records in the selected period, including zero-cost service records.</p>
      <h3 className="text-sm font-semibold">Repeat repair patterns</h3>
      <Table><TableHeader><TableRow><TableHead>Vehicle / category</TableHead><TableHead className="text-right">Occurrences</TableHead><TableHead>Previous</TableHead><TableHead>Latest</TableHead><TableHead className="text-right">Days between</TableHead><TableHead className="text-right">Total cost</TableHead></TableRow></TableHeader><TableBody>
        {current.repairPatterns.map(row => <TableRow key={`${row.vehicleId}-${row.category}`}><TableCell><Link href={`/vehicles/${row.vehicleId}`} className="text-teal underline">{row.vehicleId}</Link> · {row.category}</TableCell><TableCell className="text-right">{row.occurrences}</TableCell><TableCell className="whitespace-nowrap">{formatDate(row.previousDate)}</TableCell><TableCell className="whitespace-nowrap">{formatDate(row.latestDate)}</TableCell><TableCell className="text-right">{row.daysBetween}</TableCell><TableCell className="text-right">{formatZAR(row.totalCostCents)}</TableCell></TableRow>)}
        {!current.repairPatterns.length && <TableRow><TableCell colSpan={6}>No repeated repair categories recorded for this period.</TableCell></TableRow>}
      </TableBody></Table><p className="text-xs text-muted">A repeated category is a review signal; it does not confirm a recurring mechanical fault. Downtime is unavailable because repair start and completion dates are not recorded.</p>
    </section>
    <section id="mileage" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Mileage intelligence</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        ["Total recorded", formatKm(current.mileage.totalKm)], ["Average per week", formatKm(Math.round(current.mileage.averageKmPerWeek))],
        ["Average per day", formatKm(Math.round(current.mileage.averageKmPerDay))], ["Highest complete vehicle-week", formatKm(current.mileage.highestWeeklyKm)],
        ["Over-limit vehicle-weeks", String(current.mileage.violations.length)], ["Over-limit distance", formatKm(current.mileage.overLimitKm)],
      ].map(([label, value]) => <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></CardContent></Card>)}</div>
      <p className="text-xs text-muted">The 2,000 km threshold is assessed per vehicle per complete Monday–Sunday week. Partial boundary weeks are excluded from limit and anomaly checks. Averages divide recorded distance by selected calendar days; missing logs are not estimated.</p>
      <Table><TableHeader><TableRow><TableHead>Vehicle / week</TableHead><TableHead className="text-right">Recorded km</TableHead><TableHead className="text-right">Prior 4-week average</TableHead><TableHead className="text-right">Difference</TableHead></TableRow></TableHeader><TableBody>
        {current.mileage.anomalies.map(row => <TableRow key={`${row.vehicleId}-${row.week}`}><TableCell><Link href={`/mileage?vehicleId=${row.vehicleId}`} className="text-teal underline">{row.vehicleId}</Link> · {formatDate(row.week)}</TableCell><TableCell className="text-right">{formatKm(row.km)}</TableCell><TableCell className="text-right">{formatKm(Math.round(row.averageKm))}</TableCell><TableCell className="text-right">{row.changePercent.toFixed(1)}%</TableCell></TableRow>)}
        {!current.mileage.anomalies.length && <TableRow><TableCell colSpan={4}>No deviations of at least 50% with four consecutive prior recorded weeks in this selection.</TableCell></TableRow>}
      </TableBody></Table><Link href={report.mileageHref} className="inline-block text-sm text-teal underline">Review mileage records</Link>
    </section>
    <section id="utilization" className="rounded-card border bg-card p-4 space-y-2 scroll-mt-20"><h2 className="text-lg font-semibold">Activity coverage</h2><p className="text-sm text-muted">{current.recordedVehicleCount} of {current.vehicles.length} selected vehicles have transaction or mileage records in this period. This measures record coverage. True utilization, available hours and downtime are not captured.</p></section>
    <section id="trends" className="space-y-3 scroll-mt-20"><h2 className="text-lg font-semibold">Period trends</h2><PeriodTrendChart rows={current.monthly} />
      <Table><TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Profit</TableHead><TableHead className="text-right">Maintenance</TableHead><TableHead className="text-right">Mileage</TableHead></TableRow></TableHeader><TableBody>{current.monthly.map(row => <TableRow key={row.month}><TableCell>{row.month}</TableCell><TableCell className="text-right">{formatZAR(row.incomeCents)}</TableCell><TableCell className="text-right">{formatZAR(row.expenseCents)}</TableCell><TableCell className="text-right">{formatZAR(row.netProfitCents)}</TableCell><TableCell className="text-right">{formatZAR(row.maintenanceCents)}</TableCell><TableCell className="text-right">{formatKm(row.mileageKm)}</TableCell></TableRow>)}</TableBody></Table>
    </section>
  </div>;
}
