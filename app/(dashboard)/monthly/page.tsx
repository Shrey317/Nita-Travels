export const dynamic = "force-dynamic";

import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { MonthlyTable } from "@/components/monthly/monthly-table";
import { MonthlyChart } from "@/components/monthly/monthly-chart";
import { PageHeader } from "@/components/shared/page-header";

export default async function MonthlyPage() {
  const rows = await getMonthlyBreakdown();
  const rowsWithData = rows.filter((r) => r.hasData);
  
  const dateRange = rowsWithData.length > 0
    ? `${rowsWithData[0]?.monthKey} – ${rowsWithData[rowsWithData.length - 1]?.monthKey}`
    : "No data available";

  return (
    <div className="space-y-6">
      <PageHeader title="Monthly Breakdown" description={dateRange} />
      <MonthlyChart rows={rows} />
      <MonthlyTable rows={rows} />
    </div>
  );
}
