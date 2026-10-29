import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('saved views retain filters across reloads and can be removed', async ({ page }) => {
  await login(page);
  await page.goto('/transactions?vehicleId=CR91');
  await page.getByText('Saved views', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Saved view name' }).fill('CR91 ledger');
  await page.getByRole('button', { name: 'Save current view', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'View saved.' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('nita-report-presets-v1') ?? '[]')[0]?.query)).toBe('vehicleId=CR91');
  await page.goto('/transactions');
  const saved = page.locator('details').filter({ has: page.getByText('Saved views', { exact: true }) });
  if ((await saved.getAttribute('open')) === null) await saved.locator('summary').click();
  await page.getByRole('link', { name: 'CR91 ledger', exact: true }).click();
  await expect(page).toHaveURL(/vehicleId=CR91/);
  await page.getByText('Saved views', { exact: true }).click();
  await page.getByRole('button', { name: 'Remove saved view CR91 ledger', exact: true }).click();
  await expect(page.getByRole('link', { name: 'CR91 ledger', exact: true })).toHaveCount(0);
});
