export const dynamic = "force-dynamic";

import { getCategoryBreakdown, getVehiclePerformanceRanking } from "@/lib/db/analytics";
import { CategoryBreakdownTable } from "@/components/analytics/category-breakdown-table";
import { VehicleRankingTable } from "@/components/analytics/vehicle-ranking-table";
import { VehicleNetProfitChart } from "@/components/analytics/vehicle-net-profit-chart";
import { ExpenseByCategoryPie } from "@/components/analytics/expense-by-category-pie";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Card, CardContent } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const [categoryBreakdown, vehicleRanking] = await Promise.all([
    getCategoryBreakdown(),
    getVehiclePerformanceRanking(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Fleet performance, by category and by vehicle." />

      <section className="space-y-3">
        <SectionHeading title="By Category" />
        <CategoryBreakdownTable rows={categoryBreakdown} />
      </section>

      <section className="space-y-3">
        <SectionHeading title="Vehicle Performance Ranking" />
        <VehicleRankingTable rows={vehicleRanking} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="space-y-3">
          <SectionHeading title="Net P/L by Vehicle" />
          <Card>
            <CardContent className="pt-6">
              <VehicleNetProfitChart rows={vehicleRanking} />
            </CardContent>
          </Card>
        </section>
        <section className="space-y-3">
          <SectionHeading title="Expense by Category" />
          <Card>
            <CardContent className="pt-6">
              <ExpenseByCategoryPie rows={categoryBreakdown} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
