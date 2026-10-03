import { ValidationError } from "@/lib/errors";

export type DateRange = { from?: Date; to?: Date };
export type ClosedDateRange = { from: Date; to: Date };
export type AnalyticsSearchParams = { range?: string; dateFrom?: string; dateTo?: string; vehicleId?: string; comparison?: string };
const DAY = 86_400_000;

export const PERIOD_OPTIONS = [
  ["today", "Today"], ["yesterday", "Yesterday"],
  ["week", "This week"], ["last-week", "Last week"], ["month", "This month"],
  ["last-month", "Last month"], ["3-months", "Last 3 months"], ["6-months", "Last 6 months"],
  ["ytd", "Year to date"], ["previous-year", "Previous year"], ["year", "Current year"],
  ["12-months", "Last 12 months"], ["all", "Full history"], ["custom", "Custom range"],
] as const;
export const COMPARISON_OPTIONS = [
  ["previous-period", "Previous equivalent period"], ["previous-month", "Previous month"],
  ["previous-year", "Same period last year"], ["rolling-4", "Rolling 4-week average"],
  ["rolling-3", "Rolling 3-month average"],
] as const;

/** SQL DATE values are UTC calendar dates. Only 'today' uses the fleet's business timezone. */
export function businessToday(now: Date = new Date()): Date {
  return new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)}T00:00:00.000Z`);
}
export function dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
export function addDays(date: Date, days: number): Date { return new Date(date.getTime() + days * DAY); }
export function calendarDays(range: ClosedDateRange): number { return Math.floor((range.to.getTime() - range.from.getTime()) / DAY) + 1; }
export function isoWeekStart(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return addDays(day, -((day.getUTCDay() + 6) % 7));
}
export function parseCalendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError("Use a valid date in YYYY-MM-DD format.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || dateKey(date) !== value) throw new ValidationError("Use a valid calendar date.");
  return date;
}
function monthStart(date: Date, offset = 0): Date { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1)); }
function monthEnd(date: Date, offset = 0): Date { return addDays(monthStart(date, offset + 1), -1); }
function shiftMonths(date: Date, offset: number): Date {
  const first = monthStart(date, offset);
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(date.getUTCDate(), monthEnd(first).getUTCDate())));
}

export function parseDateRange(rangeStr?: string, now: Date = new Date()): DateRange {
  const today = businessToday(now);
  const year = today.getUTCFullYear();
  switch (rangeStr) {
    case "today": return { from: today, to: today };
    case "yesterday": return { from: addDays(today, -1), to: addDays(today, -1) };
    case "week": return { from: isoWeekStart(today), to: addDays(isoWeekStart(today), 6) };
    case "last-week": return { from: addDays(isoWeekStart(today), -7), to: addDays(isoWeekStart(today), -1) };
    case "month": return { from: monthStart(today), to: monthEnd(today) };
    case "last-month": return { from: monthStart(today, -1), to: monthEnd(today, -1) };
    case "3-months": return { from: monthStart(today, -2), to: monthEnd(today) };
    case "6-months": return { from: monthStart(today, -5), to: monthEnd(today) };
    case "12-months": return { from: monthStart(today, -11), to: monthEnd(today) };
    case "year": return { from: new Date(Date.UTC(year, 0, 1)), to: new Date(Date.UTC(year, 11, 31)) };
    case "ytd": return { from: new Date(Date.UTC(year, 0, 1)), to: today };
    case "previous-year": return { from: new Date(Date.UTC(year - 1, 0, 1)), to: new Date(Date.UTC(year - 1, 11, 31)) };
    default: return {};
  }
}
export function getPreviousPeriod(current: DateRange): DateRange {
  if (!current.from || !current.to) return {};
  const days = calendarDays({ from: current.from, to: current.to });
  return { from: addDays(current.from, -days), to: addDays(current.from, -1) };
}

export function resolveAnalyticsSelection(params: AnalyticsSearchParams = {}, now: Date = new Date(), historyRange?: ClosedDateRange) {
  const preset = PERIOD_OPTIONS.some(([key]) => key === params.range) ? params.range! : "month";
  const parsed = preset === "all" ? historyRange ?? { from: businessToday(now), to: businessToday(now) } : preset === "custom"
    ? { from: parseCalendarDate(params.dateFrom ?? ""), to: parseCalendarDate(params.dateTo ?? "") }
    : parseDateRange(preset, now);
  if (!parsed.from || !parsed.to) throw new ValidationError("Choose a complete date range.");
  const range: ClosedDateRange = { from: parsed.from, to: parsed.to };
  if (range.from > range.to || (preset === "custom" && calendarDays(range) > 3660)) throw new ValidationError("Choose an ordered custom date range of at most ten years.");
  const comparison = COMPARISON_OPTIONS.some(([key]) => key === params.comparison) ? params.comparison! : "previous-period";
  const prior = getPreviousPeriod(range);
  let comparisonRange: ClosedDateRange = { from: prior.from!, to: prior.to! };
  let comparisonScale = 1;
  let comparisonLabel: string = COMPARISON_OPTIONS.find(([key]) => key === comparison)![1];
  if (comparison === "previous-month" || comparison === "previous-year") {
    const offset = comparison === "previous-month" ? -1 : -12;
    comparisonRange = { from: shiftMonths(range.from, offset), to: shiftMonths(range.to, offset) };
  } else if (comparison === "rolling-4" || comparison === "rolling-3") {
    const to = addDays(range.from, -1);
    comparisonRange = { from: comparison === "rolling-4" ? addDays(range.from, -28) : shiftMonths(range.from, -3), to };
    comparisonScale = calendarDays(range) / calendarDays(comparisonRange);
    comparisonLabel += ` (daily average × ${calendarDays(range)} selected days)`;
  }
  const vehicleId = params.vehicleId?.trim() || undefined;
  if (vehicleId && !/^[A-Za-z0-9_-]{1,50}$/.test(vehicleId)) throw new ValidationError("Choose a valid vehicle.");
  return { preset, range, comparison, comparisonRange, comparisonScale, comparisonLabel, vehicleId, label: `${dateKey(range.from)} – ${dateKey(range.to)}` };
}
export type AnalyticsSelection = ReturnType<typeof resolveAnalyticsSelection>;

export function monthlySelection(params: AnalyticsSearchParams & { year?: string }, now = new Date()) {
  const today = businessToday(now);
  const requestedYear = Number(params.year);
  const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100 ? requestedYear : today.getUTCFullYear();
  const mode = params.range === "custom" ? "custom" : params.range === "ytd" ? "ytd" : "year";
  const yearToDateEnd = shiftMonths(today, (year - today.getUTCFullYear()) * 12);
  const selection = resolveAnalyticsSelection({ range: "custom", vehicleId: params.vehicleId,
    dateFrom: mode === "custom" ? params.dateFrom : `${year}-01-01`,
    dateTo: mode === "custom" ? params.dateTo : mode === "ytd" ? dateKey(yearToDateEnd) : `${year}-12-31`,
    comparison: "previous-year" }, now);
  return { year, mode, selection };
}

export function weeklyRange(params: { range?: string; dateFrom?: string; dateTo?: string }, now = new Date()): DateRange {
  const today = businessToday(now);
  const selected = params.range ?? "52";
  if (selected === "all") return {};
  if (selected === "custom") return resolveAnalyticsSelection({ ...params, range: "custom" }, now).range;
  if (selected === "current-year") return parseDateRange("year", now);
  if (selected === "prev-year") return parseDateRange("previous-year", now);
  const weeks = ["12", "26", "52"].includes(selected) ? Number(selected) : 52;
  return { from: addDays(isoWeekStart(today), -(weeks - 1) * 7), to: today };
}

