import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('protected routes require login and invalid credentials show an error', async ({ page }) => {
  await page.goto('/analytics');
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Username', { exact: true }).fill('incorrect-fixture-user');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-fixture-password');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Incorrect username or password' })).toBeVisible();
});

test('login and logout revoke access to the dashboard', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'User menu' }).click();
  await page.getByLabel('Account and appearance').getByRole('button', { name: 'Sign Out', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
});

test('unauthenticated API mutations and exports are denied', async ({ request }) => {
  const response = await request.post('/api/transactions', { data: { category: 'Income', incomeZarCents: 100 } });
  expect([401, 403]).toContain(response.status());
  const exported = await request.get('/api/transactions/export', { maxRedirects: 0 });
  expect([401, 403, 307]).toContain(exported.status());
});
