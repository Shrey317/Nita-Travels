import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/format";
import { TrendingUp, TrendingDown, DollarSign, Truck, AlertTriangle, Wrench, ShieldAlert } from "lucide-react";

export interface TrendData {
  percent: number;
  isPositive: boolean;
  label: string;
}

export interface DashboardStats {
  incomeCents: number;
  expenseCents: number;
  netProfitCents: number;
  repairsCents: number;
  
  incomeTrend?: TrendData;
  expenseTrend?: TrendData;
  netProfitTrend?: TrendData;
  repairsTrend?: TrendData;

  activeCount: number;
  serviceOverdueCount: number;
  serviceDueCount: number;
  insuranceExpiredCount: number;
  insuranceExpiringCount: number;
  missingMileageCount: number;
  mileageViolationsCount: number;
}

export function ExtendedKpiCards({ stats }: { stats: DashboardStats }) {
  const isProfit = stats.netProfitCents > 0;
  const avgIncome = stats.activeCount ? stats.incomeCents / stats.activeCount : 0;
  const avgCost = stats.activeCount ? stats.expenseCents / stats.activeCount : 0;

  const renderTrend = (trend?: TrendData) => {
    if (!trend) return null;
    return (
      <div className={`mt-2 flex items-center text-xs font-medium ${trend.isPositive ? 'text-status-green' : 'text-status-red'}`}>
        {trend.isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
        <span>{trend.percent.toFixed(1)}%</span>
        <span className="ml-1 text-muted font-normal">{trend.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Financials Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-0">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-green to-emerald-400" />
          <div className="absolute -right-4 -top-4 text-status-green/5 transition-transform duration-500 group-hover:scale-110">
            <TrendingUp className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-status-green">{formatZAR(stats.incomeCents)}</p>
            <div className="flex items-center justify-between">
              <p className="mt-1 text-xs text-muted">Avg {formatZAR(avgIncome)} / veh</p>
              {renderTrend(stats.incomeTrend)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-75">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-red to-rose-400" />
          <div className="absolute -right-4 -top-4 text-status-red/5 transition-transform duration-500 group-hover:scale-110">
            <TrendingDown className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-status-red">{formatZAR(stats.expenseCents)}</p>
            <div className="flex items-center justify-between">
              <p className="mt-1 text-xs text-muted">Avg {formatZAR(avgCost)} / veh</p>
              {renderTrend(stats.expenseTrend)}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-150">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy to-navy-light" />
          <div className="absolute -right-4 -top-4 text-navy/5 transition-transform duration-500 group-hover:scale-110">
            <DollarSign className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Net Profit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-2">
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between">
                <p className="font-mono text-2xl font-semibold text-ink">{formatZAR(stats.netProfitCents)}</p>
                <Badge variant={isProfit ? "success" : "destructive"}>{isProfit ? "Profit" : "Loss"}</Badge>
              </div>
              {renderTrend(stats.netProfitTrend)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-150">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
          <div className="absolute -right-4 -top-4 text-orange-500/5 transition-transform duration-500 group-hover:scale-110">
            <Wrench className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Repairs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-orange-500">{formatZAR(stats.repairsCents)}</p>
            {renderTrend(stats.repairsTrend)}
          </CardContent>
        </Card>
      </div>

      {/* Operational Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal to-teal-light" />
          <div className="absolute -right-4 -top-4 text-teal/5 transition-transform duration-500 group-hover:scale-110">
            <Truck className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Active Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-2xl font-semibold text-ink">{stats.activeCount}</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-yellow to-amber-400" />
          <div className="absolute -right-4 -top-4 text-status-yellow/5 transition-transform duration-500 group-hover:scale-110">
            <AlertTriangle className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Service Needs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Overdue</span>
              <span className={`font-mono font-medium ${stats.serviceOverdueCount > 0 ? "text-status-red" : "text-ink"}`}>{stats.serviceOverdueCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Due Soon</span>
              <span className={`font-mono font-medium ${stats.serviceDueCount > 0 ? "text-status-yellow" : "text-ink"}`}>{stats.serviceDueCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-status-red to-rose-400" />
          <div className="absolute -right-4 -top-4 text-status-red/5 transition-transform duration-500 group-hover:scale-110">
            <ShieldAlert className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Insurance Needs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Expired</span>
              <span className={`font-mono font-medium ${stats.insuranceExpiredCount > 0 ? "text-status-red" : "text-ink"}`}>{stats.insuranceExpiredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Expiring</span>
              <span className={`font-mono font-medium ${stats.insuranceExpiringCount > 0 ? "text-status-yellow" : "text-ink"}`}>{stats.insuranceExpiringCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-200">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-400" />
          <div className="absolute -right-4 -top-4 text-purple-500/5 transition-transform duration-500 group-hover:scale-110">
            <AlertTriangle className="h-24 w-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted">Mileage Needs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Missing Logs</span>
              <span className={`font-mono font-medium ${stats.missingMileageCount > 0 ? "text-status-red" : "text-ink"}`}>{stats.missingMileageCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Violations</span>
              <span className={`font-mono font-medium ${stats.mileageViolationsCount > 0 ? "text-status-yellow" : "text-ink"}`}>{stats.mileageViolationsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
