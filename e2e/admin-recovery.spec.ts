import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/db/client';
import { verifyTestEnvironment } from '../lib/db/safety';
import { hashResetToken } from '../lib/password-reset';
import { login } from './helpers';
test('verified administrator recovery replaces the old credential and preserves administrator access', async ({ page }) => {
  await verifyTestEnvironment(true);
  const token = randomBytes(32).toString('hex');
  await prisma.administratorCredential.create({ data: { id: 'admin', email: 'owner@example.test', passwordHash: await bcrypt.hash(process.env.TEST_PASSWORD!, 4) } });
  try {
  await prisma.passwordReset.create({ data: { tokenHash: hashResetToken(token), principalType: 'ADMIN_VERIFY', staffId: 'admin', sessionVersion: 0, expiresAt: new Date(Date.now() + 60000) } });
  await page.goto(`/admin-recovery#${token}`);
  await page.getByRole('button', { name: 'Verify recovery address', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Administrator recovery verified');
  await login(page);
  await page.goto('/staff');
  await expect(page.getByRole('heading', { name: 'Users & Access', exact: true })).toBeVisible();
  const reset = randomBytes(32).toString('hex');
  await prisma.passwordReset.create({ data: { tokenHash: hashResetToken(reset), principalType: 'ADMIN', staffId: 'admin', sessionVersion: 0, expiresAt: new Date(Date.now() + 60000) } });
  await page.goto(`/reset-password#${reset}`);
  await page.getByLabel('New password', { exact: true }).fill('new-administrator-fixture');
  await page.getByRole('button', { name: 'Save new password', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Password updated');
  await page.goto('/staff');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Username', { exact: true }).fill(process.env.TEST_USERNAME!);
  await page.getByLabel('Password', { exact: true }).fill('new-administrator-fixture');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  } finally {
    await prisma.administratorCredential.update({ where: { id: 'admin' }, data: { emailVerifiedAt: null, passwordHash: await bcrypt.hash(process.env.TEST_PASSWORD!, 4), sessionVersion: { increment: 1 } } });
  }
});
