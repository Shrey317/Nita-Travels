export const dynamic = "force-dynamic";

import { getWeeklyBreakdown } from "@/lib/db/weekly";
import { WeeklyChart } from "@/components/weekly/weekly-chart";
import { WeeklyTable } from "@/components/weekly/weekly-table";
import { WeeklySummary } from "@/components/weekly/weekly-summary";
import { WeeklyRangeSelector } from "@/components/weekly/weekly-range-selector";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { weeklyRange, dateKey } from "@/lib/date-ranges";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";

export default async function WeeklyPage(
  props: { searchParams: Promise<{ range?: string; dateFrom?: string; dateTo?: string; vehicleId?: string }> }
) {
  const searchParams = await props.searchParams;
  const rangeParam = searchParams.range || "52";
  const { from, to } = weeklyRange(searchParams);
  const [rows, vehicles] = await Promise.all([getWeeklyBreakdown(from, to, searchParams.vehicleId || undefined), prisma.vehicle.findMany({ where: { deletedAt: null }, select: { id: true }, orderBy: { id: "asc" } })]);

  return (
    <div className="space-y-8">
      <PageHeader title="Weekly Breakdown" description="Financial performance and fleet metrics by week">
        <WeeklyRangeSelector />
      </PageHeader>
      <form className="flex flex-wrap items-end gap-3 rounded-card border bg-card p-4" aria-label="Weekly filters">
        <input type="hidden" name="range" value={rangeParam} />
        <label className="text-sm">Vehicle<select name="vehicleId" defaultValue={searchParams.vehicleId ?? ""} className="mt-1 block h-10 rounded-input border bg-card px-3"><option value="">All vehicles and overhead</option>{vehicles.map(vehicle => <option key={vehicle.id}>{vehicle.id}</option>)}</select></label>
        {rangeParam === "custom" && <><label className="text-sm">From<input className="mt-1 block h-10 rounded-input border bg-card px-3" type="date" required name="dateFrom" defaultValue={from ? dateKey(from) : ""} /></label><label className="text-sm">To<input className="mt-1 block h-10 rounded-input border bg-card px-3" type="date" required name="dateTo" defaultValue={to ? dateKey(to) : ""} /></label></>}
        <Button type="submit" variant="outline">Apply filters</Button>
      </form>
      <p className="text-xs text-muted">Monday-start ISO weeks. Boundary-week labels cover the full week; totals include only the selected dates. Mileage is attributed to the reading date.</p>

      <section>
        <SectionHeading title="Performance Summary" />
        <div className="mt-4">
          <WeeklySummary rows={rows} />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeading title="Weekly Trends" />
        <Card>
          <CardContent className="pt-6">
            <WeeklyChart rows={rows} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeading title="Detailed Weekly Logs" />
        <WeeklyTable rows={rows} />
      </section>
    </div>
  );
}
