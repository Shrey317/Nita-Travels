export const dynamic = "force-dynamic";

import Link from "next/link";
import { getAnalyticsReport } from "@/lib/db/analytics";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { getFleetNotifications } from "@/lib/db/notifications";
import { SERVICE_STATUS_SORT_ORDER } from "@/lib/service";
import { FinancialSnapshot } from "@/components/analytics/financial-snapshot";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { VehicleSummaryTable } from "@/components/dashboard/vehicle-summary-table";
import { ServiceOverviewTable } from "@/components/dashboard/service-overview-table";
import { TodaysPriorities } from "@/components/dashboard/todays-priorities";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatZAR, formatMargin } from "@/lib/format";
import { businessToday, type AnalyticsSearchParams } from "@/lib/date-ranges";
import { FinancialChart } from "@/components/vehicles/financial-chart";

export default async function DashboardPage({ searchParams }: { searchParams: AnalyticsSearchParams }) {
  const [report, services, notifications] = await Promise.all([
    getAnalyticsReport(searchParams), getServiceStatusAllVehicles(), getFleetNotifications(),
  ]);
  const serviceMap = new Map(services.map((row) => [row.vehicleId, row]));
  const vehicleMap = new Map(report.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const vehicleRows = report.current.vehicles.flatMap((row) => {
    const vehicle = vehicleMap.get(row.vehicleId);
    return vehicle ? [{ vehicle, incomeCents: row.incomeCents, expenseCents: row.expenseCents,
      repairsCents: row.repairsCents, netProfitCents: row.netProfitCents,
      marginLabel: formatMargin(row.incomeCents, row.expenseCents), service: serviceMap.get(row.vehicleId) ?? null }] : [];
  });
  const serviceRows = [...services].sort((a, b) => SERVICE_STATUS_SORT_ORDER[a.status] - SERVICE_STATUS_SORT_ORDER[b.status]);
  const activeCount = report.vehicles.filter((vehicle) => vehicle.active).length;
  const attentionCount = new Set(notifications.filter((item) => item.vehicleId && item.priority !== "info").map((item) => item.vehicleId)).size;
  const statuses = [
    { label: "Total vehicles", value: report.vehicles.length, href: "/vehicles", tone: "text-ink" },
    { label: "Active", value: activeCount, href: "/vehicles?status=active", tone: "text-status-success" },
    { label: "Attention required", value: attentionCount, href: "/alerts", tone: attentionCount ? "text-status-warning" : "text-ink" },
    { label: "Inactive", value: report.vehicles.length - activeCount, href: "/vehicles?status=inactive", tone: "text-muted" },
  ];
  const priorities = notifications.map((item) => ({ vehicleId: item.vehicleId ?? "Fleet", severity: item.priority, title: item.title, description: item.description, href: item.href }));
  const totals = report.current.totals;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) if (value) query.set(key, value);
  const analyticsHref = `/analytics?${query}`;
  return (
    <div className="space-y-8">
      <PageHeader title="Fleet Management" description={businessToday().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}>
        <Button asChild variant="outline"><Link href={`/reports?${query}`}>Reports</Link></Button>
        <Button asChild><Link href="/transactions/new">Log transaction</Link></Button>
      </PageHeader>
      <section aria-label="Current fleet status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statuses.map((status) => <Link key={status.label} href={status.href} className="rounded-card border border-border bg-card p-4 transition-colors hover:border-brand-blue/50"><p className="text-xs font-medium text-muted">{status.label}</p><p className={`mt-2 text-2xl font-semibold tabular-nums ${status.tone}`}>{status.value}</p></Link>)}
      </section>
      <TodaysPriorities items={priorities} />
      <section className="space-y-4">
        <SectionHeading title="Financial Snapshot" />
        <AnalyticsFilters selection={report.selection} vehicles={report.vehicles} />
        <FinancialSnapshot report={report} />
      </section>
      <section className="space-y-3">
        <SectionHeading title="Fleet Performance" />
        <p className="text-xs text-muted">{report.selection.label}. Totals include fleet-wide and unassigned records; inactive vehicles retain their financial history.</p>
        <VehicleSummaryTable vehicles={vehicleRows} fleetTotals={totals} totalLabel={report.selection.vehicleId ? "Selected vehicle total" : "Grand Total (fleet-wide)"} />
      </section>
      <section className="space-y-3">
        <SectionHeading title="Maintenance & Mileage" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Repair expenditure", value: formatZAR(totals.repairsCents), detail: `${report.current.maintenance.repairCount} repair records`, href: `${report.sourceHref}&category=Repairs&category=BrakePads&category=Tyres` },
            { label: "Service expenditure", value: formatZAR(totals.serviceCents), detail: `${report.current.maintenance.serviceCount} service records`, href: `${report.sourceHref}&category=Service` },
            { label: "Total maintenance", value: formatZAR(totals.maintenanceCents), detail: "Repairs, services and maintenance categories", href: `${analyticsHref}#maintenance` },
            { label: "Recorded distance", value: `${totals.mileageKm.toLocaleString("en-ZA")} km`, detail: `${report.current.mileage.violations.length} complete vehicle-weeks over limit`, href: report.mileageHref },
          ].map((metric) => <Card key={metric.label}><CardContent className="p-4"><Link href={metric.href} className="text-sm font-medium text-muted hover:underline">{metric.label}</Link><p className="mt-2 break-words text-xl font-semibold tabular-nums">{metric.value}</p><p className="mt-1 text-xs text-muted">{metric.detail}</p></CardContent></Card>)}
        </div>
        <ServiceOverviewTable rows={serviceRows} />
      </section>
      <section className="space-y-3">
        <SectionHeading title="Financial Trends" />
        <FinancialChart data={report.current.monthly} />
      </section>
      <section className="space-y-3">
        <SectionHeading title="Management Insights" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card><CardContent className="p-4"><h3 className="font-medium">Why profit changed</h3><p className="mt-2 text-sm text-muted">Current profit {formatZAR(totals.netProfitCents)}; comparison profit {formatZAR(report.previous.totals.netProfitCents)}.</p><p className="mt-2 text-sm">Revenue contribution to the change: {formatZAR(report.profitBridge.revenueChange)}.</p><Link href={`${analyticsHref}#financial`} className="mt-3 inline-block text-sm text-brand-blue hover:underline">Inspect all numerical contributors →</Link></CardContent></Card>
          <Card><CardContent className="p-4"><h3 className="font-medium">Records needing review</h3><p className="mt-2 text-sm text-muted">{report.current.repairPatterns.length} repeated repair category patterns and {report.current.dataIssues.length} data quality findings in this selection.</p><div className="mt-3 flex flex-wrap gap-4 text-sm"><Link href={`${analyticsHref}#maintenance`} className="text-brand-blue hover:underline">Maintenance evidence →</Link><Link href={`/data-quality?${query}`} className="text-brand-blue hover:underline">Data quality →</Link></div></CardContent></Card>
        </div>
      </section>
    </div>
  );
}
