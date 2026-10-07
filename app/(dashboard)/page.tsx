export const dynamic = "force-dynamic";

import { getAnalyticsReport } from "@/lib/db/analytics";
import { getServiceStatusAllVehicles } from "@/lib/db/service";
import { getFleetNotifications } from "@/lib/db/notifications";
import { getTransactions } from "@/lib/db/transactions";
import type { AnalyticsSearchParams } from "@/lib/date-ranges";

// New Phase 4 Components
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { FleetKPIs } from "@/components/dashboard/fleet-kpis";
import { FinancialOverview } from "@/components/dashboard/financial-overview";
import { FleetStatus } from "@/components/dashboard/fleet-status";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { UpcomingServices } from "@/components/dashboard/upcoming-services";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";

export default async function DashboardPage(props: { searchParams: Promise<AnalyticsSearchParams> }) {
  const searchParams = await props.searchParams;
  
  // Fetch all necessary dashboard data
  const serviceRead = getServiceStatusAllVehicles();
  const [report, services, notifications, transactionsData] = await Promise.all([
    getAnalyticsReport(searchParams),
    serviceRead,
    getFleetNotifications(serviceRead),
    getTransactions({ limit: 10 }), // fetch recent transactions
  ]);

  const activeCount = report.vehicles.filter((vehicle) => vehicle.active).length;
  const attentionCount = new Set(notifications.filter((item) => item.vehicleId && item.priority !== "info").map((item) => item.vehicleId)).size;
  const inactiveCount = report.vehicles.length - activeCount;

  return (
    <div className="space-y-6 flex flex-col w-full animate-fade-in">
      {/* SECTION 1: Welcome / context header */}
      <DashboardHero />

      {/* SECTION 2: Fleet KPI cards */}
      <FleetKPIs 
        total={report.vehicles.length}
        active={activeCount}
        attention={attentionCount}
        inactive={inactiveCount}
      />

      {/* SECTION 3 & 4: Financial Overview (with chart) + Fleet Status */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <FinancialOverview report={report} />
        <FleetStatus 
          total={report.vehicles.length}
          active={activeCount}
          attention={attentionCount}
          inactive={inactiveCount}
          recentVehicles={report.vehicles} // Using report vehicles as recent (can sort if needed)
        />
      </div>

      {/* SECTION 5, 6, 7: Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentTransactions transactions={transactionsData.items} />
        <UpcomingServices services={services} />
        <AlertsPanel alerts={notifications} />
      </div>
    </div>
  );
}
