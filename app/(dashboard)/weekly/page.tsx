export const dynamic = "force-dynamic";

import { getWeeklyBreakdown } from "@/lib/db/weekly";
import { getAvailableYears } from "@/lib/db/monthly"; // Shared year lookup
import { WeeklyTable } from "@/components/weekly/weekly-table";
import { WeeklyChart } from "@/components/weekly/weekly-chart";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelector } from "@/components/finance/year-selector";

interface WeeklyPageProps {
  searchParams: { year?: string };
}

export default async function WeeklyPage({ searchParams }: WeeklyPageProps) {
  const currentYear = new Date().getFullYear();
  const yearParam = searchParams.year ? parseInt(searchParams.year, 10) : NaN;
  const selectedYear = !isNaN(yearParam) && yearParam > 2000 ? yearParam : currentYear;

  const [availableYears, rows] = await Promise.all([
    getAvailableYears(),
    getWeeklyBreakdown(selectedYear)
  ]);
  
  const hasData = rows.some((r) => r.hasData);

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Breakdown" description={`Financial performance by week`} />
      
      <YearSelector availableYears={availableYears} selectedYear={selectedYear} />

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted">
          No financial activity recorded for ISO year {selectedYear}.
        </div>
      ) : (
        <>
          <WeeklyChart rows={rows} />
          <WeeklyTable rows={rows} />
        </>
      )}
    </div>
  );
}
