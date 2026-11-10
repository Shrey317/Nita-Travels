import { expect, it } from 'vitest';
import { sanitizeMonitoringEvent } from '@/lib/monitoring-sanitize';
it('drops credentials, private payloads, breadcrumbs and query strings', () => {
  const clean = sanitizeMonitoringEvent({ type: undefined, message: 'private-secret', user: { email: 'private@example.test' }, extra: { password: 'private-secret' }, breadcrumbs: [{ message: 'private-secret' }], exception: { values: [{ type: 'TypeError', value: 'private-secret', stacktrace: { frames: [{ filename: 'https://app.example/page?token=private-secret', lineno: 4 }] } }] } });
  expect(JSON.stringify(clean)).not.toContain('private-secret');
  expect(clean.user).toBeUndefined();
  expect(clean.exception?.values?.[0]?.stacktrace?.frames?.[0]?.filename).toBe('https://app.example/page');
});
