import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ prisma: { $queryRaw: mocks.query } }));
import { GET } from '@/app/api/ready/route';
describe('private database readiness probe', () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('MONITORING_SECRET', 'a'.repeat(40)); mocks.query.mockResolvedValue([]); });
  afterEach(() => vi.unstubAllEnvs());
  it('denies missing and malformed secrets without querying data', async () => {
    for (const authorization of ['', 'Bearer wrong', 'Bearer ' + 'é'.repeat(40)]) {
      const response = await GET(new Request('https://fleet.example/api/ready', { headers: { authorization } }));
      expect(response.status).toBe(401);
    }
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('verifies required tables and returns no records', async () => {
    const response = await GET(new Request('https://fleet.example/api/ready', { headers: { authorization: 'Bearer ' + 'a'.repeat(40) } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(mocks.query).toHaveBeenCalledTimes(7);
  });
  it('returns an unavailable status if a required table is absent', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.query.mockRejectedValue(new Error('private connection details'));
    const response = await GET(new Request('https://fleet.example/api/ready', { headers: { authorization: 'Bearer ' + 'a'.repeat(40) } }));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unavailable' });
    log.mockRestore();
  });
});
