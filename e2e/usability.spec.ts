import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => login(page));

test('dashboard exposes financial figures and working transaction drill-down', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Financial Overview', exact: true })).toBeVisible();
  const figures = page.locator('summary').filter({ hasText: 'View monthly figures' });
  await figures.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Monthly financial figures' })).toBeVisible();
  const transaction = page.locator('a[href^="/transactions?txId="]').first();
  await transaction.click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('upload policy permits the Blob API transport without contacting a live store', async ({ page }) => {
  let intercepted = false;
  await page.route('https://vercel.com/api/blob/**', async (route) => {
    intercepted = true;
    await route.fulfill({ status: 200, contentType: 'application/json', headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }, body: JSON.stringify({ ok: true }) });
  });
  const status = await page.evaluate(async () => {
    const response = await fetch('https://vercel.com/api/blob/?pathname=csp-check', { method: 'PUT', body: 'synthetic test' });
    return response.status;
  });
  expect(status).toBe(200);
  expect(intercepted).toBe(true);
});

test('mobile navigation, transaction cards, sorting and offline status work', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const quick = page.getByRole('navigation', { name: 'Quick navigation' });
  await quick.getByRole('link', { name: 'Vehicles', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await page.goto('/transactions?vehicleId=CR91');
  const cards = page.getByLabel('Transaction cards');
  await expect(cards.locator('article').first()).toBeVisible();
  await page.getByLabel('Sort transactions', { exact: true }).selectOption('expenseZarCents:desc');
  await expect(page).toHaveURL(/sortBy=expenseZarCents/);
  await cards.getByRole('button', { name: 'Edit transaction' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await context.setOffline(true);
  await expect(page.getByRole('status').filter({ hasText: 'You’re offline' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('You’re offline', { exact: false })).not.toBeVisible();
});

test('filter browser history restores controls and rejects reversed dates', async ({ page }) => {
  await page.goto('/analytics?range=12-months');
  await page.getByRole('form', { name: 'Analytics filters' }).getByLabel('Period', { exact: true }).selectOption('last-month');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/range=last-month/);
  await page.goBack();
  await expect(page.getByRole('form', { name: 'Analytics filters' }).getByLabel('Period', { exact: true })).toHaveValue('12-months');
  await page.getByRole('form', { name: 'Analytics filters' }).getByLabel('Period', { exact: true }).selectOption('custom');
  await page.getByRole('form', { name: 'Analytics filters' }).getByLabel('From', { exact: true }).fill('2026-06-20');
  await page.getByRole('form', { name: 'Analytics filters' }).getByLabel('To', { exact: true }).fill('2026-06-01');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/range=12-months/);
  expect(await page.getByRole('form', { name: 'Analytics filters' }).evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
});

test('transaction saves successfully when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('Storage unavailable'); };
    Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); };
  });
  const note = `Storage fallback ${Date.now()}`;
  await page.goto('/transactions/new?vehicleId=CR91');
  await page.getByLabel('Category', { exact: true }).click();
  await page.getByRole('option', { name: 'Income', exact: true }).click();
  await page.getByLabel('Income (R)', { exact: true }).fill('12.34');
  await page.getByLabel('Notes', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  const response = await page.request.get(`/api/transactions?search=${encodeURIComponent(note)}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.total).toBe(1);
});

test('mobile sorting reflects the order selected on desktop', async ({ page }) => {
  await page.goto('/transactions');
  await page.getByRole('button', { name: 'Sort by Category', exact: true }).click();
  await expect(page).toHaveURL(/sortBy=category/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('Sort transactions', { exact: true })).toHaveValue('category:desc');
  await page.getByLabel('Sort transactions', { exact: true }).selectOption('mileageKm:asc');
  await expect(page).toHaveURL(/sortBy=mileageKm&sortDir=asc/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('columnheader').filter({ has: page.getByRole('button', { name: 'Sort by Mileage (km)', exact: true }) })).toHaveAttribute('aria-sort', 'ascending');
});
