export const dynamic = "force-dynamic";

import { getWeeklyBreakdown } from "@/lib/db/weekly";
import { WeeklyChart } from "@/components/weekly/weekly-chart";
import { WeeklyTable } from "@/components/weekly/weekly-table";
import { WeeklySummary } from "@/components/weekly/weekly-summary";
import { WeeklyRangeSelector } from "@/components/weekly/weekly-range-selector";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { startOfYear, endOfYear, subWeeks, startOfISOWeek } from "date-fns";

function getRangeDates(range: string) {
  const now = new Date();
  switch (range) {
    case "12": {
      const from = subWeeks(startOfISOWeek(now), 11);
      return { from, to: now };
    }
    case "26": {
      const from = subWeeks(startOfISOWeek(now), 25);
      return { from, to: now };
    }
    case "52": {
      const from = subWeeks(startOfISOWeek(now), 51);
      return { from, to: now };
    }
    case "current-year": {
      return { from: startOfYear(now), to: endOfYear(now) };
    }
    case "prev-year": {
      const prev = new Date(now.getFullYear() - 1, 0, 1);
      return { from: startOfYear(prev), to: endOfYear(prev) };
    }
    case "all":
    default:
      return { from: undefined, to: undefined };
  }
}

export default async function WeeklyPage({ searchParams }: { searchParams: { range?: string } }) {
  const rangeParam = searchParams.range || "52";
  const { from, to } = getRangeDates(rangeParam);

  const rows = await getWeeklyBreakdown(from, to);

  return (
    <div className="space-y-8">
      <PageHeader title="Weekly Breakdown" description="Financial performance and fleet metrics by week">
        <WeeklyRangeSelector />
      </PageHeader>

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
