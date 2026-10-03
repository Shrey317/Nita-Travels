import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.setTimeout(90_000);
test.beforeEach(async ({ page }) => login(page));

test('vehicle creation, editing and deactivation preserve an accessible inactive profile', async ({ page }) => {
  await page.goto('/vehicles/new');
  for (const [label, value] of [['Vehicle ID', 'CR95'], ['Make', 'Suzuki'], ['Model', 'Swift'], ['Registration', 'TEST 095 GP'], ['Purchase Price (R)', '150000.25'], ['Mileage at Purchase (km)', '10000'], ['Current Mileage (km)', '10000']]) {
    await page.getByLabel(label!, { exact: true }).fill(value!);
  }
  await page.getByRole('button', { name: 'Add Vehicle', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles\/CR95$/);
  await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Registration', { exact: true }).fill('TEST 095 EDITED');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles\/CR95$/);
  await expect(page.locator('main')).toContainText('TEST 095 EDITED');
  await page.getByRole('button', { name: 'Deactivate', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles$/);
  await page.goto('/vehicles/CR95');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Suzuki Swift');
  await page.getByRole('link', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Warranty', { exact: true }).fill('No warranty');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page).toHaveURL(/\/vehicles\/CR95$/);
  await expect(page.locator('main').getByText('Inactive', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deactivate', exact: true })).toHaveCount(0);
});

test('mileage create, edit and delete recalculate the stored odometer', async ({ page }) => {
  await page.goto('/mileage/new?vehicleId=CR93');
  await expect(page.getByLabel('Previous Mileage', { exact: true })).toHaveValue(/30.*000/);
  await page.getByLabel('Current Mileage (km)', { exact: true }).fill('31500');
  await page.getByRole('button', { name: 'Log Mileage', exact: true }).click();
  await expect(page).toHaveURL(/\/mileage$/);
  await page.goto('/mileage?vehicleId=CR93');
  const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Edit mileage entry' }) });
  await row.getByRole('button', { name: 'Edit mileage entry' }).click();
  await page.getByRole('dialog').getByLabel('Current Mileage (km)', { exact: true }).fill('31600');
  await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(row).toContainText(/31.*600/);
  const edited = await page.request.get('/api/vehicles/CR93');
  expect((await edited.json()).vehicle.currentMileageKm).toBe(31600);
  await row.getByRole('button', { name: 'Delete mileage entry' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(row).toHaveCount(0);
  const restored = await page.request.get('/api/vehicles/CR93');
  expect((await restored.json()).vehicle.currentMileageKm).toBe(30000);
});
