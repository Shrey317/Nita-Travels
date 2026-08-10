import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/format";
import { TrendingUp, TrendingDown, DollarSign, Truck } from "lucide-react";

interface KpiCardsProps {
  incomeCents: number;
  expenseCents: number;
  netProfitCents: number;
  fleetSize: number;
}

/** Net P/L > 0 -> Profit, <= 0 -> Loss (SRS Section 9 status badge rules). */
export function KpiCards({ incomeCents, expenseCents, netProfitCents, fleetSize }: KpiCardsProps) {
  const isProfit = netProfitCents > 0;

  return (
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
          <p className="font-mono text-2xl font-semibold text-status-green">{formatZAR(incomeCents)}</p>
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
          <p className="font-mono text-2xl font-semibold text-status-red">{formatZAR(expenseCents)}</p>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-150">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy to-navy-light" />
        <div className="absolute -right-4 -top-4 text-navy/5 transition-transform duration-500 group-hover:scale-110">
          <DollarSign className="h-24 w-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Net P/L</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <p className="font-mono text-2xl font-semibold text-ink">{formatZAR(netProfitCents)}</p>
          <Badge variant={isProfit ? "success" : "destructive"}>{isProfit ? "🟢 Profit" : "🔴 Loss"}</Badge>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden hover:-translate-y-1 hover:shadow-card-hover animate-slide-up delay-200">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal to-teal-light" />
        <div className="absolute -right-4 -top-4 text-teal/5 transition-transform duration-500 group-hover:scale-110">
          <Truck className="h-24 w-24" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Fleet Size</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold text-ink">{fleetSize}</p>
        </CardContent>
      </Card>
    </div>
  );
}
