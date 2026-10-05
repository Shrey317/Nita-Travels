export const dynamic = "force-dynamic";
import Link from "next/link";
import { getAnalyticsReport } from "@/lib/db/analytics";
import type { AnalyticsSearchParams } from "@/lib/date-ranges";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { FinancialSnapshot } from "@/components/analytics/financial-snapshot";
import { ProfitBridge } from "@/components/analytics/profit-bridge";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { REPORT_TYPES } from "@/lib/reports";

export default async function ReportsPage(props: { searchParams: Promise<AnalyticsSearchParams> }) {
  const searchParams = await props.searchParams;
  const report = await getAnalyticsReport(searchParams);
  const query = new URLSearchParams({ range: report.selection.preset === "all" ? "all" : "custom", dateFrom: report.selection.label.slice(0, 10), dateTo: report.selection.label.slice(-10), comparison: report.selection.comparison });
  if (report.selection.vehicleId) query.set("vehicleId", report.selection.vehicleId);
  return <div className="space-y-6"><PageHeader title="Reports" description="Export the same verified figures used by the dashboard and analytics." />
    <AnalyticsFilters selection={report.selection} vehicles={report.vehicles} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{REPORT_TYPES.map(([type, title, description]) => <article key={type} className="rounded-card border bg-card p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 min-h-12 text-sm text-muted">{description}</p><Button asChild variant="outline" className="mt-4"><a href={`/api/reports/export?${query}&type=${type}`}>Download CSV</a></Button></article>)}</div>
    <p className="text-xs text-muted">Every export uses the selected vehicle and dates shown above. Weekly and monthly reports group this selection; choose This week or This month for a standard reporting window. Financial CSV values are integer cents with currency declared as ZAR. Insurance exports show current policy records and the selected report dates.</p>
    <FinancialSnapshot report={report} /><ProfitBridge report={report} />
    <Link href={report.sourceHref} className="inline-block text-sm text-teal underline">Inspect source transactions</Link>
  </div>;
}
