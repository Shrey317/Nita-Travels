import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/rate-limit';

describe('persistent login limits', () => {
  beforeAll(() => verifyTestEnvironment(true));
  it('allows ten attempts, rejects the eleventh and recovers after expiry', async () => {
    const key = 'release-rate-limit:fixture';
    for (let attempt = 0; attempt < 10; attempt++) expect((await checkLoginRateLimit(key)).allowed).toBe(true);
    expect(await checkLoginRateLimit(key)).toMatchObject({ allowed: false });
    await prisma.rateLimit.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await checkLoginRateLimit(key)).allowed).toBe(true);
    expect((await prisma.rateLimit.findUniqueOrThrow({ where: { key } })).points).toBe(1);
    await clearLoginRateLimit(key);
    expect(await prisma.rateLimit.findUnique({ where: { key } })).toBeNull();
    await clearLoginRateLimit(key);
  });
  it('counts simultaneous attempts atomically', async () => {
    const key = 'release-concurrent:fixture';
    const results = await Promise.all(Array.from({ length: 15 }, () => checkLoginRateLimit(key)));
    expect(results.filter(result => result.allowed)).toHaveLength(10);
    expect((await prisma.rateLimit.findUniqueOrThrow({ where: { key } })).points).toBe(15);
    await clearLoginRateLimit(key);
  });
});
