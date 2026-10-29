import { expect, it } from 'vitest';
import { isAllowedWriteOrigin } from '@/lib/request-origin';

it('rejects foreign and opaque browser origins without blocking same-origin writes or API clients', () => {
  const base = 'https://fleet.example';
  expect(isAllowedWriteOrigin('POST', base, 'same-origin', base)).toBe(true);
  expect(isAllowedWriteOrigin('POST', 'https://attacker.example', 'cross-site', base)).toBe(false);
  expect(isAllowedWriteOrigin('PATCH', 'https://sibling.example', 'same-site', base)).toBe(false);
  expect(isAllowedWriteOrigin('DELETE', 'null', null, base)).toBe(false);
  expect(isAllowedWriteOrigin('POST', null, null, base)).toBe(true);
  expect(isAllowedWriteOrigin('GET', 'https://attacker.example', 'cross-site', base)).toBe(true);
});
