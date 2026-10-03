import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatZAR } from "@/lib/format";
import { calculateChange } from "@/lib/finance";
import type { AnalyticsReport } from "@/lib/db/analytics";

export function FinancialSnapshot({ report }: { report: AnalyticsReport }) {
  const { current, previous } = report;
  const metrics = [
    { key: "incomeCents", label: "Revenue", kind: "money" },
    { key: "expenseCents", label: "Expenses", kind: "money" },
    { key: "netProfitCents", label: "Net profit", kind: "money" },
    { key: "margin", label: "Profit margin", kind: "ratio" },
    { key: "revenuePerKmCents", label: "Revenue / km", kind: "money" },
    { key: "costPerKmCents", label: "Cost / km", kind: "money" },
    { key: "profitPerKmCents", label: "Profit / km", kind: "money" },
  ] as const;
  const display = (value: number | null, kind: string) => value === null ? "—" : kind === "ratio" ? `${(value * 100).toFixed(1)}%` : formatZAR(value);
  return (
    <section aria-label="Financial snapshot" className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(metric => {
          const value = current.totals[metric.key];
          const prior = previous.totals[metric.key];
          const change = calculateChange(value, prior);
          return <Card key={metric.key}><CardContent className="p-4">
            <Link href={report.sourceHref} className="text-sm font-medium text-muted hover:text-ink hover:underline">{metric.label}</Link>
            <p className={`my-2 break-words text-2xl font-semibold tracking-tight font-mono-figures ${metric.key === "netProfitCents" && value !== null && value < 0 ? "text-status-error" : "text-ink"}`}>{display(value, metric.kind)}</p>
            <p className="text-xs text-muted">Previous: {display(prior, metric.kind)}</p>
            <p className="mt-1 text-xs text-ink-secondary">
              {change.delta === null ? "Insufficient mileage or revenue" : <>{change.delta > 0 ? "↑" : change.delta < 0 ? "↓" : "→"} {metric.kind === "ratio" ? `${(Math.abs(change.delta) * 100).toFixed(1)} pp` : display(Math.abs(change.delta), metric.kind)} · {change.percent === null ? "No percentage baseline" : `${Math.abs(change.percent).toFixed(1)}%`}</>}
            </p>
          </CardContent></Card>;
        })}
        <Card><CardContent className="p-4">
          <Link href={report.mileageHref} className="text-sm font-medium text-muted hover:underline">Recorded mileage</Link>
          <p className="my-2 text-2xl font-semibold font-mono-figures">{current.totals.mileageKm.toLocaleString("en-ZA")} km</p>
          <p className="text-xs leading-relaxed text-muted">Per-km figures use readings dated in this period. Missing logs reduce coverage; distances are not estimated.</p>
        </CardContent></Card>
      </div>
      <p className="text-xs text-muted">Comparison: {report.selection.comparisonLabel}. A dash means the ratio is undefined. Select a financial label to inspect contributing transactions.</p>
    </section>
  );
}
