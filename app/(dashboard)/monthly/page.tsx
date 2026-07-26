export const dynamic = "force-dynamic";

import { getMonthlyBreakdown } from "@/lib/db/monthly";
import { MonthlyTable } from "@/components/monthly/monthly-table";
import { MonthlyChart } from "@/components/monthly/monthly-chart";

export default async function MonthlyPage() {
  const rows = await getMonthlyBreakdown();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Monthly Breakdown</h1>
        <p className="text-sm text-muted">January 2024 – December 2026</p>
      </div>
      <MonthlyChart rows={rows} />
      <MonthlyTable rows={rows} />
    </div>
  );
}
