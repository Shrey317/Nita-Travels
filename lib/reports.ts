import type { AnalyticsReport } from "@/lib/db/analytics";
import { csvEscape } from "@/lib/csv";
import { dateKey } from "@/lib/date-ranges";

export const REPORT_TYPES = [
  ["weekly", "Weekly Fleet Report", "Weekly revenue, expense, profit, maintenance and mileage."],
  ["monthly", "Monthly Management Report", "Monthly performance and recorded activity."],
  ["financial", "Financial Report", "Current and comparison metrics with category-level evidence."],
  ["vehicles", "Vehicle Performance Report", "Per-vehicle profitability, distance and maintenance."],
  ["maintenance", "Maintenance Report", "Repair patterns, expenditure and record frequency."],
  ["mileage", "Mileage Report", "Recorded weekly distance, over-limit events and anomaly evidence."],
  ["insurance", "Insurance Report", "Current insurer, policy, premium and expiry records."],
] as const;
export type ReportType = typeof REPORT_TYPES[number][0];
export function isReportType(value: string): value is ReportType { return REPORT_TYPES.some(([key]) => key === value); }
export function csvRows(rows: readonly (readonly (string | number | null)[])[]): string {
  return rows.map(row => row.map(value => typeof value === "number" ? String(value) : csvEscape(value ?? "")).join(",")).join("\r\n");
}

export function reportCsv(report: AnalyticsReport, type: Exclude<ReportType, "weekly" | "monthly">) {
  const rows: (string | number | null)[][] = [
    ["Report", type], ["Currency", "ZAR; monetary amounts in integer cents unless named per-km"],
    ["From", dateKey(report.selection.range.from)], ["To", dateKey(report.selection.range.to)],
    ["Vehicle", report.selection.vehicleId ?? "All (including fleet-wide and unassigned ledger records)"],
    ["Comparison", report.selection.comparisonLabel], [],
  ];
  const { current, previous } = report;
  if (type === "financial") {
    rows.push(["Metric", "Current", "Comparison"]);
    for (const key of ["incomeCents", "expenseCents", "netProfitCents", "margin", "mileageKm", "revenuePerKmCents", "costPerKmCents", "profitPerKmCents", "repairsCents", "serviceCents", "maintenanceCents"] as const) rows.push([key, current.totals[key], previous.totals[key]]);
    rows.push([], ["Category", "Income cents", "Expense cents", "Records"]);
    for (const row of current.categories) rows.push([row.category, row.incomeCents, row.expenseCents, row.count]);
  } else if (type === "vehicles") {
    rows.push(["Vehicle", "Registration", "Revenue cents", "Expense cents", "Profit cents", "Margin ratio", "Mileage km", "Revenue cents/km", "Cost cents/km", "Profit cents/km", "Repairs cents", "Maintenance cents"]);
    for (const row of current.vehicles) rows.push([row.vehicleId, row.registration, row.incomeCents, row.expenseCents, row.netProfitCents, row.margin, row.mileageKm, row.revenuePerKmCents, row.costPerKmCents, row.profitPerKmCents, row.repairsCents, row.maintenanceCents]);
    rows.push(["Unallocated ledger", "", current.unallocated.incomeCents, current.unallocated.expenseCents, current.unallocated.netProfitCents]);
  } else if (type === "maintenance") {
    rows.push(["Repair cents", current.totals.repairsCents], ["Service cents", current.totals.serviceCents], ["Maintenance cents", current.totals.maintenanceCents], ["Repair records", current.maintenance.repairCount], ["Service records", current.maintenance.serviceCount], ["Downtime", "Unavailable: start/completion dates not recorded"], [], ["Vehicle", "Category", "Occurrences", "Previous repair", "Latest repair", "Days between", "Total cost cents"]);
    for (const row of current.repairPatterns) rows.push([row.vehicleId, row.category, row.occurrences, row.previousDate, row.latestDate, row.daysBetween, row.totalCostCents]);
  } else if (type === "mileage") {
    rows.push(["Attribution", "Distance assigned to the later odometer reading date; no distance estimated"], ["Vehicle", "Week starting", "Recorded km", "Complete selected week exceeds 2000 km"]);
    for (const row of current.mileage.weekly) rows.push([row.vehicleId, row.week, row.km, current.mileage.violations.includes(row) ? "Yes" : "No / partial week"]);
    rows.push([], ["Vehicle", "Anomaly week", "Km", "Prior four-week average km", "Change percent"]);
    for (const row of current.mileage.anomalies) rows.push([row.vehicleId, row.week, row.km, row.averageKm, row.changePercent]);
  } else {
    rows.push(["Vehicle", "Registration", "Insurer", "Policy", "Monthly premium cents (configured, not paid)", "Expiry", "Warranty text"]);
    for (const row of report.vehicles.filter(vehicle => !report.selection.vehicleId || vehicle.id === report.selection.vehicleId)) rows.push([row.id, row.registration, row.insurer, row.policyNumber, row.monthlyPremiumCents, row.insuranceEndDate ? dateKey(row.insuranceEndDate) : null, row.warranty]);
  }
  return csvRows(rows);
}
