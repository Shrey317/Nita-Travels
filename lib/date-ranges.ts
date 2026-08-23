import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subDays, subWeeks } from "date-fns";

export type DateRange = { from?: Date; to?: Date };

export function parseDateRange(rangeStr?: string): DateRange {
  const now = new Date();
  
  switch (rangeStr) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "last-week": {
      const lastWeek = subWeeks(now, 1);
      return { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
    }
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "last-month": {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "3-months": {
      const threeMonthsAgo = subMonths(now, 3);
      return { from: startOfMonth(threeMonthsAgo), to: endOfMonth(now) };
    }
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "all":
    default:
      return { from: undefined, to: undefined };
  }
}

export function getPreviousPeriod(currentRange: DateRange): DateRange {
  if (!currentRange.from || !currentRange.to) return { from: undefined, to: undefined };
  
  const diffTime = currentRange.to.getTime() - currentRange.from.getTime();
  const prevTo = new Date(currentRange.from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - diffTime);
  
  return { from: prevFrom, to: prevTo };
}

