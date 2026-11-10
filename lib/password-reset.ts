import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db/client';
import { adminUpdateStaffSchema } from '@/lib/staff-registration';

export const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function requestPasswordReset(email: string) {
  const sender = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  const origin = process.env.AUTH_URL || process.env.NEXTAUTH_URL;
  if (!sender || !password || !origin) throw new Error('Recovery unavailable');
  const base = new URL(origin);
  if (base.protocol !== 'https:' && base.hostname !== '127.0.0.1' && base.hostname !== 'localhost') throw new Error('Invalid recovery origin');
  const administrator = await prisma.administratorCredential.findUnique({ where: { email } });
  const isAdmin = !!administrator?.emailVerifiedAt;
  const account = isAdmin ? { ...administrator!, status: 'ACTIVE' } : await prisma.staffAccount.findUnique({ where: { email } });
  if (!account || account.status !== 'ACTIVE') return;
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(token);
  await prisma.passwordReset.create({ data: { tokenHash, staffId: account.id, principalType: isAdmin ? 'ADMIN' : 'STAFF', sessionVersion: account.sessionVersion, expiresAt: new Date(Date.now() + 15 * 60 * 1000) } });
  const link = new URL('/reset-password', base);
  link.hash = token;
  try {
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: sender, pass: password }, connectionTimeout: 10000, socketTimeout: 15000, logger: false, debug: false });
    await transport.sendMail({ from: sender, to: account.email, subject: 'Reset your Nita Travels password', text: `A password reset was requested for your Nita Travels account. Open this link within 15 minutes:\n\n${link.href}\n\nIf you did not request this, ignore this email.` });
  } catch {
    await prisma.passwordReset.updateMany({ where: { tokenHash }, data: { usedAt: new Date() } });
    throw new Error('Recovery delivery failed');
  }
}

export async function completePasswordReset(token: string, password: string) {
  const validPassword = adminUpdateStaffSchema.parse({ password }).password!;
  const passwordHash = await bcrypt.hash(validPassword, 12);
  await prisma.$transaction(async tx => {
    const tokenHash = hashResetToken(token);
    const reset = await tx.passwordReset.findUnique({ where: { tokenHash } });
    const now = new Date();
    if (!reset || reset.usedAt || reset.expiresAt <= now) throw new Error('Invalid reset');
    if (!['ADMIN', 'STAFF'].includes(reset.principalType)) throw new Error('Invalid reset');
    const claimed = await tx.passwordReset.updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (claimed.count !== 1) throw new Error('Invalid reset');
    const updated = reset.principalType === 'ADMIN'
      ? await tx.administratorCredential.updateMany({ where: { id: 'admin', emailVerifiedAt: { not: null }, sessionVersion: reset.sessionVersion }, data: { passwordHash, sessionVersion: { increment: 1 } } })
      : await tx.staffAccount.updateMany({ where: { id: reset.staffId, status: 'ACTIVE', sessionVersion: reset.sessionVersion }, data: { passwordHash, sessionVersion: { increment: 1 } } });
    if (updated.count !== 1) throw new Error('Invalid reset');
  });
}
