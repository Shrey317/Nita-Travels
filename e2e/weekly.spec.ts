import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => login(page));

test('weekly ranges update the table and chart', async ({ page }) => {
  await page.goto('/weekly');
  await expect(page.getByRole('heading', { name: 'Weekly Breakdown', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
  const range = page.getByRole('combobox').first();
  await range.click();
  await page.getByRole('option', { name: 'Last 12 weeks', exact: true }).click();
  await expect(page).toHaveURL(/range=12/);
  await range.click();
  await page.getByRole('option', { name: 'Full History', exact: true }).click();
  await expect(page).toHaveURL(/range=all/);
});

test('monthly recorded data and an empty historical period render', async ({ page }) => {
  await page.goto('/monthly');
  await expect(page.getByRole('table')).toBeVisible();
  await page.goto('/monthly?year=2001');
  await expect(page.getByText(/No financial activity|No transactions/i)).toBeVisible();
});

test('analytics filters and vehicle drill-down are available', async ({ page }) => {
  await page.goto('/analytics');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Analytics/);
  await expect(page.locator('main')).toContainText(/Profit|profit/);
  await expect(page.locator('main a[href*="/vehicles/CR91"]').first()).toBeVisible();
  await page.goto('/analytics?range=last-month&vehicleId=CR91');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByLabel('Period', { exact: true })).toHaveValue('last-month');
  await expect(page.getByLabel('Vehicle', { exact: true })).toHaveValue('CR91');
  await expect(page.locator('main')).not.toContainText(/NaN|Infinity|\[object Object\]/);
});
