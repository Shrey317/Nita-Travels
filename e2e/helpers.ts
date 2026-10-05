import { expect, type Page } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(process.env.TEST_USERNAME!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  // Allow a cold production server to initialize its database connection and dashboard.
  await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
  await expect(page.locator('main')).toBeVisible();
}
