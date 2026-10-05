export const dynamic = "force-dynamic";
import Link from "next/link";
import { getAnalyticsReport } from "@/lib/db/analytics";
import { getFleetNotifications } from "@/lib/db/notifications";
import { intelligenceAlerts } from "@/lib/intelligence";
import type { AnalyticsSearchParams } from "@/lib/date-ranges";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";

export default async function AlertsPage(
  props: { searchParams: Promise<AnalyticsSearchParams & { severity?: string; category?: string }> }
) {
  const searchParams = await props.searchParams;
  const [report, operational] = await Promise.all([getAnalyticsReport(searchParams), getFleetNotifications()]);
  const all = intelligenceAlerts(report, operational);
  const alerts = all.filter(row => (!searchParams.severity || row.severity === searchParams.severity) && (!searchParams.category || row.category === searchParams.category));
  const href = (severity: string) => { const params = new URLSearchParams(searchParams); severity ? params.set("severity", severity) : params.delete("severity"); return `/alerts?${params}`; };
  return <div className="space-y-6"><PageHeader title="Alert Center" description="Current operational priorities and evidence from the selected financial period." />
    <AnalyticsFilters selection={report.selection} vehicles={report.vehicles} />
    <nav aria-label="Alert severity" className="flex flex-wrap gap-2">{["", "critical", "warning", "info"].map(severity => <Link key={severity} href={href(severity)} aria-current={(searchParams.severity ?? "") === severity ? "page" : undefined} className="rounded-button border bg-card px-3 py-2 text-sm capitalize aria-[current=page]:border-teal">{severity || "All"} ({severity ? all.filter(row => row.severity === severity).length : all.length})</Link>)}</nav>
    <p className="text-xs text-muted">Service, insurance and this-week mileage reflect current status. Financial changes, repeat repairs and data findings use the selected range. Repeated categories are review signals, not diagnoses.</p>
    <div className="space-y-3">{alerts.map(row => <Link key={row.id} href={row.href} className="block rounded-card border bg-card p-4 hover:border-teal"><div className="flex flex-wrap items-center gap-2"><Badge variant={row.severity === "critical" ? "destructive" : row.severity === "warning" ? "warning" : "secondary"}>{row.severity === "info" ? "Information" : row.severity}</Badge><span className="text-xs uppercase text-muted">{row.category}{row.vehicleId ? ` · ${row.vehicleId}` : ""}</span></div><h2 className="mt-2 font-semibold">{row.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted">{row.evidence}</p><p className="mt-2 text-xs text-teal">Review source →</p></Link>)}</div>
    {!alerts.length && <div className="rounded-card border border-dashed p-8 text-center text-muted">No alerts match these filters.</div>}
  </div>;
}
