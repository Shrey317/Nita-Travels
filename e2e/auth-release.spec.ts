import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { prisma } from '../lib/db/client';
import { verifyTestEnvironment } from '../lib/db/safety';
import { login } from './helpers';

test('real login limits reject a correct password while locked and recover after expiry', async ({ page }) => {
  await verifyTestEnvironment(true);
  const username = process.env.TEST_USERNAME!;
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('incorrect-release-fixture');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Incorrect username or password' })).toBeVisible();
  const record = await prisma.rateLimit.findFirstOrThrow({ where: { key: { startsWith: `${username}:` } } });
  try {
    await prisma.rateLimit.update({ where: { key: record.key }, data: { points: 10 } });
    await page.getByLabel('Username', { exact: true }).fill(username);
    await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD!);
    const rejected = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/login');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await rejected;
    await expect(page).toHaveURL(/\/login/);
    expect((await prisma.rateLimit.findUniqueOrThrow({ where: { key: record.key } })).points).toBe(11);
    await prisma.rateLimit.update({ where: { key: record.key }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await login(page);
    expect(await prisma.rateLimit.findUnique({ where: { key: record.key } })).toBeNull();
  } finally {
    await prisma.rateLimit.deleteMany({ where: { key: record.key } });
  }
});

test('expired sessions lose page and API access', async ({ page, context, browser }) => {
  const valid = await encode({ secret: process.env.NEXTAUTH_SECRET!, salt: 'authjs.session-token', maxAge: 300, token: { sub: 'admin', name: 'Expiry fixture' } });
  await context.addCookies([{ name: 'authjs.session-token', value: valid, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
  await page.goto('/transactions');
  await expect(page).toHaveURL(/\/transactions$/);
  const expired = await encode({ secret: process.env.NEXTAUTH_SECRET!, salt: 'authjs.session-token', maxAge: -300, token: { sub: 'admin', name: 'Expired fixture' } });
  // A separate jar prevents in-flight prefetch responses from renewing the valid cookie.
  const expiredContext = await browser.newContext({ baseURL: 'http://127.0.0.1:3100' });
  try {
    await expiredContext.addCookies([{ name: 'authjs.session-token', value: expired, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
    const expiredPage = await expiredContext.newPage();
    await expiredPage.goto('/transactions');
    await expect(expiredPage).toHaveURL(/\/login/);
    expect((await expiredPage.request.post('/api/notes', { data: {} })).status()).toBe(401);
  } finally { await expiredContext.close(); }
});
