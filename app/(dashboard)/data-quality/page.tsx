export const dynamic = "force-dynamic";
import Link from "next/link";
import { getAnalyticsReport } from "@/lib/db/analytics";
import type { AnalyticsSearchParams } from "@/lib/date-ranges";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { PageHeader } from "@/components/shared/page-header";

export default async function DataQualityPage({ searchParams }: { searchParams: AnalyticsSearchParams }) {
  const report = await getAnalyticsReport(searchParams);
  return <div className="space-y-6"><PageHeader title="Data Quality" description="Find incomplete records and investigate inconsistencies before relying on the numbers." />
    <AnalyticsFilters selection={report.selection} vehicles={report.vehicles} />
    <p className="text-sm text-muted">{report.current.dataIssues.length} findings. Vehicle identity and insurance checks reflect current records; transaction and mileage checks reflect the selected period. Unknown warranty coverage is not treated as expired.</p>
    <div className="grid gap-3 lg:grid-cols-2">{report.current.dataIssues.map(issue => <article key={issue.id} className="rounded-card border bg-card p-4"><p className="text-xs font-medium text-muted">{issue.vehicleId ?? "Fleet"}</p><h2 className="mt-1 font-semibold">{issue.title}</h2><p className="mt-2 text-sm text-muted">{issue.evidence}</p><Link href={issue.href} className="mt-3 inline-block text-sm text-teal underline">Review and correct record</Link></article>)}</div>
    {!report.current.dataIssues.length && <p className="rounded-card border border-dashed p-8 text-center text-muted">No issues detected by the current checks for this selection.</p>}
    <p className="text-xs text-muted">Coverage limits: structured warranty dates, downtime intervals and a vehicle document register are not recorded. This check does not certify that all historical data is complete.</p>
  </div>;
}
