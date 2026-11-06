import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db/client';
import { verifyTestEnvironment } from '../lib/db/safety';
import { hashResetToken } from '../lib/password-reset';

test('reset form changes credentials once and rejects expired and reused links', async ({ page }) => {
  await verifyTestEnvironment(true);
  const token = randomBytes(32).toString('hex');
  const expired = randomBytes(32).toString('hex');
  const account = await prisma.staffAccount.create({ data: { email: `recovery-${Date.now()}@example.test`, name: 'Recovery fixture', status: 'ACTIVE', passwordHash: await bcrypt.hash('original-password', 4) } });
  await prisma.passwordReset.createMany({ data: [
    { tokenHash: hashResetToken(token), staffId: account.id, sessionVersion: 0, expiresAt: new Date(Date.now() + 60000) },
    { tokenHash: hashResetToken(expired), staffId: account.id, sessionVersion: 0, expiresAt: new Date(0) },
  ] });
  async function submit(value: string) {
    await page.goto(`/reset-password#${value}`);
    await page.getByLabel('New password', { exact: true }).fill('replacement-password');
    await page.getByRole('button', { name: 'Save new password', exact: true }).click();
  }
  await submit(expired);
  await expect(page.getByRole('status')).toContainText('invalid or expired');
  await submit(token);
  await expect(page.getByRole('status')).toContainText('Password updated');
  await expect(page).toHaveURL(/\/reset-password$/);
  const updated = await prisma.staffAccount.findUniqueOrThrow({ where: { id: account.id } });
  expect(updated.sessionVersion).toBe(1);
  expect(await bcrypt.compare('replacement-password', updated.passwordHash)).toBe(true);
  await submit(token);
  await expect(page.getByRole('status')).toContainText('invalid or expired');
});
