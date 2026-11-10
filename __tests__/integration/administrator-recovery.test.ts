import { beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { hashResetToken, completePasswordReset } from '@/lib/password-reset';
import { verifyAdministratorRecovery } from '@/lib/administrator-recovery';
describe('administrator email verification and resets', () => {
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await prisma.administratorCredential.create({ data: { id: 'admin', email: 'owner@example.test', passwordHash: await bcrypt.hash('original-password', 4) } });
  });
  it('requires a verification token and permits one confirmation', async () => {
    await prisma.passwordReset.create({ data: { tokenHash: hashResetToken('verify-owner'), staffId: 'admin', principalType: 'ADMIN_VERIFY', sessionVersion: 0, expiresAt: new Date(Date.now() + 60000) } });
    await expect(completePasswordReset('verify-owner', 'replacement-password')).rejects.toThrow('Invalid reset');
    await verifyAdministratorRecovery('verify-owner');
    expect((await prisma.administratorCredential.findUniqueOrThrow({ where: { id: 'admin' } })).emailVerifiedAt).not.toBeNull();
    await expect(verifyAdministratorRecovery('verify-owner')).rejects.toThrow();
  });
  it('resets the administrator and revokes earlier sessions without changing staff accounts', async () => {
    const staffCount = await prisma.staffAccount.count();
    await prisma.passwordReset.create({ data: { tokenHash: hashResetToken('reset-owner'), staffId: 'admin', principalType: 'ADMIN', sessionVersion: 0, expiresAt: new Date(Date.now() + 60000) } });
    await completePasswordReset('reset-owner', 'replacement-password');
    const account = await prisma.administratorCredential.findUniqueOrThrow({ where: { id: 'admin' } });
    expect(account.sessionVersion).toBe(1);
    expect(await bcrypt.compare('replacement-password', account.passwordHash)).toBe(true);
    expect(await prisma.staffAccount.count()).toBe(staffCount);
    await expect(completePasswordReset('reset-owner', 'another-password')).rejects.toThrow();
  });
});
