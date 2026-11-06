import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { completePasswordReset, hashResetToken } from '@/lib/password-reset';

describe('password reset integrity', () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.staffAccount.create({ data: { id: 'reset-fixture', name: 'Reset Fixture', email: 'reset@example.test', status: 'ACTIVE', passwordHash: await bcrypt.hash('original-password', 4) } });
  });
  async function issue(token: string, expiresAt = new Date(Date.now() + 60000), sessionVersion = 0) {
    await prisma.passwordReset.create({ data: { tokenHash: hashResetToken(token), staffId: 'reset-fixture', sessionVersion, expiresAt } });
  }
  it('rejects expired and unknown tokens without changing credentials', async () => {
    await issue('expired', new Date(0));
    await expect(completePasswordReset('expired', 'replacement-password')).rejects.toThrow();
    await expect(completePasswordReset('unknown', 'replacement-password')).rejects.toThrow();
    expect((await prisma.staffAccount.findUniqueOrThrow({ where: { id: 'reset-fixture' } })).sessionVersion).toBe(0);
  });
  it('allows only one concurrent use and revokes all older links', async () => {
    await issue('single-use'); await issue('other-old-link');
    const outcomes = await Promise.allSettled([completePasswordReset('single-use', 'replacement-password'), completePasswordReset('single-use', 'replacement-password')]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const account = await prisma.staffAccount.findUniqueOrThrow({ where: { id: 'reset-fixture' } });
    expect(account.sessionVersion).toBe(1);
    expect(await bcrypt.compare('replacement-password', account.passwordHash)).toBe(true);
    await expect(completePasswordReset('single-use', 'another-password')).rejects.toThrow();
    await expect(completePasswordReset('other-old-link', 'another-password')).rejects.toThrow();
  });
  it('rejects weak passwords and disabled accounts', async () => {
    await issue('disabled', undefined, 1);
    await expect(completePasswordReset('disabled', 'short')).rejects.toThrow();
    await prisma.staffAccount.update({ where: { id: 'reset-fixture' }, data: { status: 'DISABLED' } });
    await expect(completePasswordReset('disabled', 'replacement-password')).rejects.toThrow();
    expect((await prisma.staffAccount.findUniqueOrThrow({ where: { id: 'reset-fixture' } })).sessionVersion).toBe(1);
  });
});
