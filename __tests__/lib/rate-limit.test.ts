import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ deleteMany: vi.fn(), upsert: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ prisma: { rateLimit: mocks } }));
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/rate-limit';

describe('login attempt limits', () => {
  beforeEach(() => vi.resetAllMocks());
  it('blocks attempts above the limit and allows the last permitted attempt', async () => {
    mocks.upsert.mockResolvedValueOnce({ points: 10, expiresAt: new Date(Date.now() + 60000) });
    expect(await checkLoginRateLimit('test')).toEqual({ allowed: true });
    mocks.upsert.mockResolvedValueOnce({ points: 11, expiresAt: new Date(Date.now() + 60000) });
    expect(await checkLoginRateLimit('test')).toMatchObject({ allowed: false });
  });
  it('denies login when attempt storage is unavailable without logging database errors', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.deleteMany.mockRejectedValue(new Error('sensitive connection details'));
    expect(await checkLoginRateLimit('test')).toEqual({ allowed: false, retryAfterSeconds: 30 });
    expect(log).toHaveBeenCalledWith('Login attempt limits are temporarily unavailable.');
    log.mockRestore();
  });
  it('tolerates a missing attempt record after successful authentication', async () => {
    mocks.delete.mockRejectedValue(new Error('not found'));
    await expect(clearLoginRateLimit('test')).resolves.toBeUndefined();
  });
});
