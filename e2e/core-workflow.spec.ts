import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => login(page));

test('vehicles support search, profile, health evidence and timeline', async ({ page }) => {
  await page.goto('/vehicles');
  await page.getByPlaceholder(/Search/i).fill('TEST 091');
  const vehicle = page.locator('a[href="/vehicles/CR91"]').first();
  await expect(vehicle).toBeVisible();
  await vehicle.click();
  await expect(page.getByText('Vehicle Health', { exact: true })).toBeVisible();
  await expect(page.getByText(/Review factors|Replacement Analysis/i).first()).toBeVisible();
  await expect(page.getByText(/Activity Timeline/i)).toBeVisible();
});

test('keyboard search finds registration and opens the matched vehicle', async ({ page }) => {
  await page.keyboard.press('Control+k');
  const input = page.getByPlaceholder(/Search vehicles/);
  await expect(input).toBeVisible();
  await input.fill('TEST 091');
  const result = page.getByRole('option').filter({ hasText: 'CR91' }).first();
  await expect(result).toBeVisible();
  await expect(page.getByRole('option').filter({ hasText: 'CR91' }).first()).toHaveAttribute('aria-selected', 'true');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/vehicles\/CR91/);
});

test('transaction creation, filtering, editing, cancellation, soft delete and export', async ({ page }) => {
  const note = `E2E cents ${Date.now()}`;
  await page.goto('/transactions/new');
  await page.getByLabel('Vehicle', { exact: true }).click();
  await page.getByRole('option').filter({ hasText: 'CR91' }).click();
  await page.getByLabel('Category', { exact: true }).click();
  await page.getByRole('option', { name: 'Income', exact: true }).click();
  await page.getByLabel('Income (R)', { exact: true }).fill('123.45');
  await page.getByLabel('Notes', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.goto(`/transactions?search=${encodeURIComponent(note)}`);
  const row = page.getByRole('row').filter({ hasText: note });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit transaction' }).click();
  await page.getByRole('dialog').getByLabel('Income (R)', { exact: true }).fill('234.56');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  const exported = await page.request.get(`/api/transactions/export?search=${encodeURIComponent(note)}`);
  expect(exported.ok()).toBeTruthy();
  expect(await exported.text()).toContain(note);
  await row.getByRole('button', { name: 'Delete transaction' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Delete transaction' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(row).not.toBeVisible();
});

test('repair creation associates the expense with its vehicle', async ({ page }) => {
  const note = `E2E repair ${Date.now()}`;
  await page.goto('/transactions/new');
  await page.getByLabel('Vehicle', { exact: true }).click();
  await page.getByRole('option').filter({ hasText: 'CR92' }).click();
  await page.getByLabel('Category', { exact: true }).click();
  await page.getByRole('option', { name: 'Repairs', exact: true }).click();
  await page.getByLabel('Expense (R)', { exact: true }).fill('750.25');
  await page.getByLabel('Notes', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Add Transaction', exact: true }).click();
  await expect(page).toHaveURL(/\/transactions$/);
  await page.goto('/repairs?vehicleId=CR92');
  await expect(page.getByRole('row').filter({ hasText: note })).toContainText('CR92');
});

test('mileage, overdue service and operational alerts expose recorded evidence', async ({ page }) => {
  await page.goto('/mileage?vehicleId=CR91');
  await expect(page.getByRole('heading', { name: /Mileage/ }).first()).toBeVisible();
  await expect(page.locator('main').getByText(/over by 300 km/i).first()).toBeVisible();
  await page.goto('/service');
  await expect(page.getByText(/OVERDUE|DUE SOON/i).first()).toBeVisible();
  await page.goto('/alerts');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Alert/);
  await expect(page.locator('main a[href*="CR91"]').first()).toBeVisible();
});
