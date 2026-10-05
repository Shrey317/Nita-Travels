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
  return <div className="space-y-6">
    <PageHeader title="Monthly Breakdown" description="Calendar-month performance with equivalent prior-year evidence." />
    <YearSelector availableYears={availableYears} selectedYear={year} />
    <form className="grid gap-3 rounded-card border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Monthly filters">
      <input type="hidden" name="year" value={year} />
      <label className="text-sm">Range<select name="range" defaultValue={mode} className="mt-1 block h-10 w-full rounded-input border bg-card px-3"><option value="year">Full selected year</option><option value="ytd">Year to date</option><option value="custom">Custom dates</option></select></label>
      <label className="text-sm">Vehicle<select name="vehicleId" defaultValue={searchParams.vehicleId ?? ""} className="mt-1 block h-10 w-full rounded-input border bg-card px-3"><option value="">All vehicles and overhead</option>{vehicles.map(vehicle => <option key={vehicle.id}>{vehicle.id}</option>)}</select></label>
      <label className="text-sm">Custom from<input type="date" name="dateFrom" defaultValue={dateKey(selection.range.from)} className="mt-1 block h-10 w-full rounded-input border bg-card px-3" /></label>
      <label className="text-sm">Custom to<input type="date" name="dateTo" defaultValue={dateKey(selection.range.to)} className="mt-1 block h-10 w-full rounded-input border bg-card px-3" /></label>
      <div className="flex items-end"><Button type="submit" variant="outline" className="w-full">Apply filters</Button></div>
    </form>
    <p className="text-xs text-muted">{selection.label}. Compared with {dateKey(selection.comparisonRange.from)} – {dateKey(selection.comparisonRange.to)}. Custom dates apply only when Custom dates is selected.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Revenue", formatZAR(current.incomeCents), formatZAR(previous.incomeCents)], ["Expenses", formatZAR(current.expenseCents), formatZAR(previous.expenseCents)], ["Profit", formatZAR(current.netProfitCents), formatZAR(previous.netProfitCents)], ["Mileage", formatKm(current.mileageKm), formatKm(previous.mileageKm)]].map(([label, value, prior]) => <div key={label} className="rounded-card border bg-card p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted">Prior year: {prior}</p></div>)}</div>
    {!rows.some(row => row.hasData) && <p className="rounded-card border border-dashed p-8 text-center text-muted">No financial activity recorded for this period.</p>}
    <MonthlyChart rows={rows} /><MonthlyTable rows={rows} />
  </div>;
}
