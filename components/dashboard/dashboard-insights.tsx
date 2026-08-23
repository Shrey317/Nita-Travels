import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle, Target } from "lucide-react";
import { formatZAR } from "@/lib/format";

export interface InsightItem {
  icon: "trending-up" | "trending-down" | "alert" | "target";
  text: string;
}

const iconMap = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  alert: AlertTriangle,
  target: Target,
};

const iconColorMap = {
  "trending-up": "text-status-green bg-status-green/10",
  "trending-down": "text-status-red bg-status-red/10",
  alert: "text-status-yellow bg-status-yellow/10",
  target: "text-teal bg-teal/10",
};

export function DashboardInsights({ insights }: { insights: InsightItem[] }) {
  if (insights.length === 0) return null;

  return (
    <Card className="animate-slide-up delay-300">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <span className="inline-block h-5 w-1 rounded-full bg-gradient-to-b from-teal to-teal-light" />
          Fleet Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {insights.map((insight, i) => {
            const Icon = iconMap[insight.icon];
            const colorClass = iconColorMap[insight.icon];
            return (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border/30 bg-surface/30 p-3"
              >
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-ink leading-relaxed">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/** Generate insights from real data. Only produce insights that are supported by the numbers. */
export function generateInsights(data: {
  vehicles: { vehicle: { id: string }; incomeCents: number; expenseCents: number; repairsCents: number; netProfitCents: number; kmSincePurchase: number }[];
  fleetIncome: number;
  fleetExpense: number;
  fleetProfit: number;
  prevFleetIncome?: number;
  prevFleetExpense?: number;
  prevFleetProfit?: number;
  serviceOverdue: number;
  missingMileage: number;
}): InsightItem[] {
  const insights: InsightItem[] = [];

  // Best performing vehicle
  const profitable = data.vehicles.filter((v) => v.netProfitCents > 0);
  if (profitable.length > 0) {
    const best = profitable.reduce((a, b) => {
      const aPerKm = a.kmSincePurchase > 0 ? a.netProfitCents / a.kmSincePurchase : 0;
      const bPerKm = b.kmSincePurchase > 0 ? b.netProfitCents / b.kmSincePurchase : 0;
      return aPerKm > bPerKm ? a : b;
    });
    if (best.kmSincePurchase > 0) {
      insights.push({
        icon: "trending-up",
        text: `${best.vehicle.id} has the highest profit per km — ${formatZAR(Math.round(best.netProfitCents / best.kmSincePurchase))}/km.`,
      });
    }
  }

  // Repair spending comparison
  if (data.prevFleetExpense !== undefined && data.prevFleetExpense > 0) {
    const totalRepairs = data.vehicles.reduce((s, v) => s + v.repairsCents, 0);
    const repairPct = data.fleetExpense > 0 ? (totalRepairs / data.fleetExpense) * 100 : 0;
    if (repairPct > 25) {
      insights.push({
        icon: "alert",
        text: `Repairs account for ${repairPct.toFixed(0)}% of total expenses this period.`,
      });
    }
  }

  // Profit trend
  if (data.prevFleetProfit !== undefined && data.prevFleetProfit !== 0) {
    const change = ((data.fleetProfit - data.prevFleetProfit) / Math.abs(data.prevFleetProfit)) * 100;
    if (Math.abs(change) > 5) {
      insights.push({
        icon: change > 0 ? "trending-up" : "trending-down",
        text: `Fleet profit is ${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(0)}% compared to the previous period.`,
      });
    }
  }

  // Missing mileage
  if (data.missingMileage > 0) {
    insights.push({
      icon: "alert",
      text: `${data.missingMileage} vehicle${data.missingMileage !== 1 ? "s have" : " has"} missing mileage data this week.`,
    });
  }

  // Service overdue
  if (data.serviceOverdue > 0) {
    insights.push({
      icon: "alert",
      text: `${data.serviceOverdue} vehicle${data.serviceOverdue !== 1 ? "s are" : " is"} overdue for service.`,
    });
  }

  // Margin insight
  if (data.fleetIncome > 0) {
    const margin = ((data.fleetIncome - data.fleetExpense) / data.fleetIncome) * 100;
    insights.push({
      icon: margin > 0 ? "target" : "trending-down",
      text: `Fleet profit margin is ${margin.toFixed(1)}%.`,
    });
  }

  return insights.slice(0, 6); // Cap at 6 insights
}
