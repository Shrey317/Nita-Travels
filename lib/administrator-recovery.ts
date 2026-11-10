import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/client';
import { ownerEmail } from '@/lib/staff-registration';
import { hashResetToken } from '@/lib/password-reset';
import { sendAccountEmail } from '@/lib/gmail';
export async function prepareAdministratorRecovery() {
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.replace(/\\/g, '');
  const origin = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (!passwordHash || !origin) throw new Error('Administrator configuration unavailable');
  const link = new URL('/admin-recovery', origin);
  if (link.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(link.hostname)) throw new Error('Invalid origin');
  const account = await prisma.administratorCredential.upsert({ where: { id: 'admin' }, update: {}, create: { id: 'admin', email: ownerEmail, passwordHash } });
  if (account.emailVerifiedAt) return;
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  await prisma.passwordReset.create({ data: { tokenHash, staffId: 'admin', principalType: 'ADMIN_VERIFY', sessionVersion: account.sessionVersion, expiresAt: new Date(Date.now() + 15 * 60000) } });
  link.hash = token;
  try { await sendAccountEmail(ownerEmail, 'Verify administrator recovery for Nita Travels', `An administrator requested recovery setup. Open this link within 15 minutes and confirm verification:\n\n${link.href}\n\nIgnore this if you did not request it.`); }
  catch { await prisma.passwordReset.updateMany({ where: { tokenHash }, data: { usedAt: new Date() } }); throw new Error('Verification delivery failed'); }
}
export async function verifyAdministratorRecovery(token: string) {
  await prisma.$transaction(async tx => {
    const tokenHash = hashResetToken(token);
    const record = await tx.passwordReset.findUnique({ where: { tokenHash } });
    const now = new Date();
    if (!record || record.principalType !== 'ADMIN_VERIFY') throw new Error('Invalid verification link');
    const consumed = await tx.passwordReset.updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (consumed.count !== 1) throw new Error('Expired verification link');
    await tx.administratorCredential.update({ where: { id: 'admin' }, data: { emailVerifiedAt: now } });
  });
}
