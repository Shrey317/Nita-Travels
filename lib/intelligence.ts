import { calculateChange } from "@/lib/finance";
import { formatZAR } from "@/lib/format";
import type { AnalyticsReport } from "@/lib/db/analytics";
import type { FleetNotification } from "@/lib/db/notifications";

export interface IntelligenceAlert {
  id: string; severity: "critical" | "warning" | "info"; category: string;
  title: string; evidence: string; vehicleId: string | null; href: string;
}

export function managementInsights(report: AnalyticsReport) {
  const { current, previous } = report;
  const change = calculateChange(current.totals.netProfitCents, previous.totals.netProfitCents);
  const rows = [{ title: "Profit movement", evidence: `${formatZAR(previous.totals.netProfitCents)} → ${formatZAR(current.totals.netProfitCents)}; change ${formatZAR(change.delta ?? 0)}.`, href: "#profit-change" }];
  const repairs = calculateChange(current.totals.repairsCents, previous.totals.repairsCents);
  rows.push({ title: "Repair expenditure", evidence: `${formatZAR(previous.totals.repairsCents)} → ${formatZAR(current.totals.repairsCents)}${repairs.percent === null ? "; no percentage baseline." : ` (${repairs.percent >= 0 ? "+" : ""}${repairs.percent.toFixed(1)}%).`}`, href: "#maintenance" });
  const highest = [...current.vehicles].filter(row => row.transactionCount > 0).sort((a, b) => b.netProfitCents - a.netProfitCents)[0];
  if (highest) rows.push({ title: "Largest vehicle profit contribution", evidence: `${highest.vehicleId}: ${formatZAR(highest.netProfitCents)}; fleet net profit ${formatZAR(current.totals.netProfitCents)}. Fleet overhead is shown separately.`, href: `/vehicles/${highest.vehicleId}` });
  if (current.mileage.violations.length) rows.push({ title: "Weekly mileage review", evidence: `${current.mileage.violations.length} recorded vehicle-weeks exceeded 2,000 km; ${current.mileage.overLimitKm.toLocaleString("en-ZA")} km above the limit. Only complete selected weeks are assessed.`, href: report.mileageHref });
  if (current.totals.maintenancePerKmCents !== null && previous.totals.maintenancePerKmCents !== null) rows.push({ title: "Maintenance cost per recorded kilometre", evidence: `${formatZAR(previous.totals.maintenancePerKmCents)} → ${formatZAR(current.totals.maintenancePerKmCents)} per km.`, href: "#maintenance" });
  return rows;
}

export function intelligenceAlerts(report: AnalyticsReport, operational: readonly FleetNotification[]): IntelligenceAlert[] {
  const alerts: IntelligenceAlert[] = operational.filter(row => !report.selection.vehicleId || row.vehicleId === report.selection.vehicleId).map(row => ({
    id: row.id, severity: row.priority, category: row.category, title: row.title, evidence: row.description, vehicleId: row.vehicleId, href: row.href,
  }));
  const { current, previous } = report;
  for (const row of current.vehicles) {
    const prior = previous.vehicles.find(vehicle => vehicle.vehicleId === row.vehicleId);
    if (prior && row.netProfitCents < prior.netProfitCents && prior.transactionCount > 0) alerts.push({
      id: `profit-${row.vehicleId}`, severity: "warning", category: "financial", vehicleId: row.vehicleId,
      title: "Vehicle profit declined", evidence: `${formatZAR(prior.netProfitCents)} → ${formatZAR(row.netProfitCents)}; selected comparison ${report.selection.comparisonLabel}.`, href: `/vehicles/${row.vehicleId}`,
    });
  }
  const expenseChange = calculateChange(current.totals.expenseCents, previous.totals.expenseCents);
  if (expenseChange.percent !== null && expenseChange.percent >= 50) alerts.push({ id: "expense-increase", severity: "warning", category: "financial", vehicleId: null, title: "Expense increase of at least 50%", evidence: `${formatZAR(previous.totals.expenseCents)} → ${formatZAR(current.totals.expenseCents)} (${expenseChange.percent.toFixed(1)}%). Review source records; this is a numerical threshold, not a cause.`, href: report.sourceHref });
  for (const row of current.repairPatterns) alerts.push({ id: `repeat-${row.vehicleId}-${row.category}`, severity: "warning", category: "repairs", vehicleId: row.vehicleId, title: "Repeat repair pattern detected", evidence: `${row.category}: ${row.occurrences} records, ${formatZAR(row.totalCostCents)}; ${row.daysBetween} days between the latest two records.`, href: `/vehicles/${row.vehicleId}?type=transactions` });
  for (const row of current.mileage.anomalies) alerts.push({ id: `anomaly-${row.vehicleId}-${row.week}`, severity: "warning", category: "mileage", vehicleId: row.vehicleId, title: "Mileage differs by at least 50% from recent average", evidence: `${row.week}: ${row.km} km versus ${row.averageKm.toFixed(0)} km average across the preceding four complete recorded weeks (${row.changePercent.toFixed(1)}%).`, href: `/mileage?vehicleId=${row.vehicleId}` });
  for (const row of current.dataIssues) alerts.push({ ...row, id: `data-${row.id}`, severity: "info", category: "data" });
  const order = { critical: 0, warning: 1, info: 2 };
  return [...new Map(alerts.map(row => [row.id, row])).values()].sort((a, b) => order[a.severity] - order[b.severity] || a.title.localeCompare(b.title));
}
