import { test, expect } from '@playwright/test';

test.describe('Weekly Breakdown Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    if (page.url().includes('/login')) {
      await page.fill('input[name="username"]', process.env.TEST_USERNAME as string);
      await page.fill('input[name="password"]', process.env.TEST_PASSWORD as string);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/', { timeout: 10000 }).catch(() => {});
    }
  });

  test('Navigate to Weekly Breakdown and use range selector', async ({ page }) => {
    // 1. Navigate to Weekly Breakdown
    await page.goto('/weekly');
    await expect(page.getByRole('heading', { name: 'Weekly Breakdown' })).toBeVisible({ timeout: 10000 });

    // 2. Page loads successfully and summary KPIs render
    await expect(page.getByText('Performance Summary')).toBeVisible();
    await expect(page.getByText('Total Income')).toBeVisible();
    await expect(page.getByText('Net Profit')).toBeVisible();
    await expect(page.getByText('Overall Margin')).toBeVisible();
    
    // 3. Chart renders
    await expect(page.getByText('Weekly Trends')).toBeVisible();
    // Assuming recharts container has a specific class or we just check for its existence
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();

    // 4. Table renders
    await expect(page.getByText('Detailed Weekly Logs')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // 5. Check range selector changes the visible data
    const rangeSelect = page.getByRole('combobox');
    await expect(rangeSelect).toBeVisible();
    
    // Select "12" weeks
    await rangeSelect.click();
    await page.getByRole('option', { name: 'Last 12 weeks' }).click();
    
    // Check URL updated
    await expect(page).toHaveURL(/.*range=12/);
    
    // Select "all" for full history
    await rangeSelect.click();
    await page.getByRole('option', { name: 'Full History' }).click();
    await expect(page).toHaveURL(/.*range=all/);
  });
});
