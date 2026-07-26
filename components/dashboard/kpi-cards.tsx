import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatZAR } from "@/lib/format";

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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold text-status-green">{formatZAR(incomeCents)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-2xl font-semibold text-status-red">{formatZAR(expenseCents)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted">Net P/L</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <p className="font-mono text-2xl font-semibold text-ink">{formatZAR(netProfitCents)}</p>
          <Badge variant={isProfit ? "success" : "destructive"}>{isProfit ? "🟢 Profit" : "🔴 Loss"}</Badge>
        </CardContent>
      </Card>

      <Card>
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
