export const dynamic = "force-dynamic";
import Link from "next/link";
import { getAnalyticsReport } from "@/lib/db/analytics";
import type { AnalyticsSearchParams } from "@/lib/date-ranges";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { FinancialSnapshot } from "@/components/analytics/financial-snapshot";
import { AnalyticsContent } from "@/components/analytics/analytics-content";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default async function AnalyticsPage({ searchParams }: { searchParams: AnalyticsSearchParams }) {
  const report = await getAnalyticsReport(searchParams);
  return <div className="space-y-6">
    <PageHeader title="Analytics" description="Financial and operational evidence, reconciled to your records."><Button asChild variant="outline"><Link href={`/reports?${new URLSearchParams(searchParams)}`}>Export reports</Link></Button></PageHeader>
    <AnalyticsFilters key={report.selection.label} selection={report.selection} vehicles={report.vehicles} />
    <nav aria-label="Analytics sections" className="flex flex-wrap gap-2 border-b pb-3">{["Overview", "Financial", "Vehicles", "Maintenance", "Mileage", "Utilization", "Trends"].map(label => <a key={label} className="rounded-button px-3 py-2 text-sm hover:bg-surface-secondary" href={`#${label.toLowerCase()}`}>{label}</a>)}<Link className="rounded-button px-3 py-2 text-sm hover:bg-surface-secondary" href={`/reports?${new URLSearchParams(searchParams)}`}>Reports</Link></nav>
    <FinancialSnapshot report={report} />
    <AnalyticsContent report={report} />
  </div>;
}
