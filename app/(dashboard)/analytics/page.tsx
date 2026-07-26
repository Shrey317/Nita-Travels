export const dynamic = "force-dynamic";

import { getCategoryBreakdown, getVehiclePerformanceRanking } from "@/lib/db/analytics";
import { CategoryBreakdownTable } from "@/components/analytics/category-breakdown-table";
import { VehicleRankingTable } from "@/components/analytics/vehicle-ranking-table";
import { VehicleNetProfitChart } from "@/components/analytics/vehicle-net-profit-chart";
import { ExpenseByCategoryPie } from "@/components/analytics/expense-by-category-pie";

export default async function AnalyticsPage() {
  const [categoryBreakdown, vehicleRanking] = await Promise.all([
    getCategoryBreakdown(),
    getVehiclePerformanceRanking(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Analytics</h1>
        <p className="text-sm text-muted">Fleet performance, by category and by vehicle.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">By Category</h2>
        <CategoryBreakdownTable rows={categoryBreakdown} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-ink">Vehicle Performance Ranking</h2>
        <VehicleRankingTable rows={vehicleRanking} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Net P/L by Vehicle</h2>
          <VehicleNetProfitChart rows={vehicleRanking} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Expense by Category</h2>
          <ExpenseByCategoryPie rows={categoryBreakdown} />
        </section>
      </div>
    </div>
  );
}
