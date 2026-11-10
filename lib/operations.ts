import { differenceInCalendarDays } from 'date-fns';
export function workOrderStatus(start: string | null, finish: string | null) {
  return finish ? 'Completed' : start ? 'In progress' : 'Scheduled';
}
export function downtimeDays(start: string | null, finish: string | null, today: string) {
  if (!start) return null;
  return Math.max(0, differenceInCalendarDays(new Date(finish || today), new Date(start)));
}
