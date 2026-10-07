export const dynamic = "force-dynamic";
import { getMonthlyBreakdown, getAvailableYears } from "@/lib/db/monthly";
import { MonthlyTable } from "@/components/monthly/monthly-table";
import { MonthlyChart } from "@/components/monthly/monthly-chart";
import { PageHeader } from "@/components/shared/page-header";
import { YearSelector } from "@/components/finance/year-selector";
import { Button } from "@/components/ui/button";
import { dateKey, monthlySelection } from "@/lib/date-ranges";
import { summarizePeriods } from "@/lib/periods";
import { formatZAR, formatKm } from "@/lib/format";
import { prisma } from "@/lib/db/client";
import { TrendingUp, TrendingDown, DollarSign, Gauge } from "lucide-react";

export default async function MonthlyPage(
  props: { searchParams: Promise<{ year?: string; range?: string; dateFrom?: string; dateTo?: string; vehicleId?: string }> }
) {
  const searchParams = await props.searchParams;
  const { year, mode, selection } = monthlySelection(searchParams);
  const [availableYears, rows, previousRows, vehicles] = await Promise.all([
    getAvailableYears(), getMonthlyBreakdown(year, selection.range, searchParams.vehicleId || undefined),
    getMonthlyBreakdown(year - 1, selection.comparisonRange, searchParams.vehicleId || undefined),
    prisma.vehicle.findMany({ where: { deletedAt: null }, select: { id: true }, orderBy: { id: "asc" } }),
  ]);
  const current = summarizePeriods(rows), previous = summarizePeriods(previousRows);

  const kpiItems = [
    { label: "Revenue", value: formatZAR(current.incomeCents), prior: formatZAR(previous.incomeCents), icon: TrendingUp, color: "text-status-success", bgColor: "bg-status-success/10 border-status-success/20" },
    { label: "Expenses", value: formatZAR(current.expenseCents), prior: formatZAR(previous.expenseCents), icon: TrendingDown, color: "text-primary", bgColor: "bg-primary/10 border-primary/20" },
    { label: "Profit", value: formatZAR(current.netProfitCents), prior: formatZAR(previous.netProfitCents), icon: DollarSign, color: current.netProfitCents >= 0 ? "text-status-success" : "text-error", bgColor: current.netProfitCents >= 0 ? "bg-status-success/10 border-status-success/20" : "bg-error/10 border-error/20" },
    { label: "Mileage", value: formatKm(current.mileageKm), prior: formatKm(previous.mileageKm), icon: Gauge, color: "text-white", bgColor: "bg-primary/10 border-primary/20" },
  ];

  return <div className="space-y-6">
    <PageHeader title="Monthly Breakdown" description="Calendar-month performance with equivalent prior-year evidence." />
    <YearSelector availableYears={availableYears} selectedYear={year} />
    <form className="grid gap-3 rounded-xl border border-border-subtle bg-card p-4 shadow-card-elevated sm:grid-cols-2 lg:grid-cols-5" aria-label="Monthly filters">
      <input type="hidden" name="year" value={year} />
      <label className="text-sm text-ink-secondary">Range<select name="range" defaultValue={mode} className="mt-1 block h-10 w-full rounded-lg border border-border-subtle bg-surface-elevated text-white px-3"><option value="year">Full selected year</option><option value="ytd">Year to date</option><option value="custom">Custom dates</option></select></label>
      <label className="text-sm text-ink-secondary">Vehicle<select name="vehicleId" defaultValue={searchParams.vehicleId ?? ""} className="mt-1 block h-10 w-full rounded-lg border border-border-subtle bg-surface-elevated text-white px-3"><option value="">All vehicles and overhead</option>{vehicles.map(vehicle => <option key={vehicle.id}>{vehicle.id}</option>)}</select></label>
      <label className="text-sm text-ink-secondary">Custom from<input type="date" name="dateFrom" defaultValue={dateKey(selection.range.from)} className="mt-1 block h-10 w-full rounded-lg border border-border-subtle bg-surface-elevated text-white px-3" /></label>
      <label className="text-sm text-ink-secondary">Custom to<input type="date" name="dateTo" defaultValue={dateKey(selection.range.to)} className="mt-1 block h-10 w-full rounded-lg border border-border-subtle bg-surface-elevated text-white px-3" /></label>
      <div className="flex items-end"><Button type="submit" variant="outline" className="w-full">Apply filters</Button></div>
    </form>
    <p className="text-xs text-muted">{selection.label}. Compared with {dateKey(selection.comparisonRange.from)} – {dateKey(selection.comparisonRange.to)}. Custom dates apply only when Custom dates is selected.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpiItems.map(({ label, value, prior, icon: Icon, color, bgColor }) => (
        <div key={label} className="rounded-xl border border-border-subtle bg-card p-4 shadow-card-elevated">
          <div className="flex items-center gap-2 mb-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${bgColor}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{label}</p>
          </div>
          <p className={`text-xl font-bold font-mono-figures ${color}`}>{value}</p>
          <p className="mt-1 text-xs text-muted">Prior year: {prior}</p>
        </div>
      ))}
    </div>
    {!rows.some(row => row.hasData) && <p className="rounded-xl border border-dashed border-border-subtle p-8 text-center text-ink-secondary">No financial activity recorded for this period.</p>}
    <MonthlyChart rows={rows} /><MonthlyTable rows={rows} />
  </div>;
}
