import { describe, expect, it } from 'vitest';
import { downtimeDays, workOrderStatus } from '@/lib/operations';
describe('repair interval reporting', () => {
  it('distinguishes planned, in-progress and completed work', () => {
    expect(workOrderStatus(null, null)).toBe('Scheduled');
    expect(workOrderStatus('2026-11-01', null)).toBe('In progress');
    expect(workOrderStatus('2026-11-01', '2026-11-03')).toBe('Completed');
  });
  it('uses actual calendar days and leaves unstarted work unavailable', () => {
    expect(downtimeDays(null, null, '2026-11-09')).toBeNull();
    expect(downtimeDays('2026-11-01', '2026-11-03', '2026-11-09')).toBe(2);
    expect(downtimeDays('2026-11-09', null, '2026-11-09')).toBe(0);
  });
});
