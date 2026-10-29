import { afterEach, expect, it, vi } from 'vitest';
const config = require('../../next.config.js');

afterEach(() => vi.unstubAllEnvs());

it('retains HTTPS upgrading for deployed origins and supports explicit loopback HTTP', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  for (const [origin, upgrade] of [['https://fleet.example', true], ['http://127.0.0.1:3100', false], ['http://fleet.example', true]] as const) {
    vi.stubEnv('AUTH_URL', origin);
    const routes = await config.headers();
    const csp = routes[0].headers.find((header: { key: string }) => header.key === 'Content-Security-Policy').value;
    expect(csp.includes('upgrade-insecure-requests')).toBe(upgrade);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  }
});
