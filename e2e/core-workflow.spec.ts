import { test, expect } from '@playwright/test';

test.describe('Core Fleet Workflow', () => {
  // We need to bypass or mock auth for this E2E test, or log in if an auth fixture exists.
  // Assuming a seeded test user or mocking session since it's NextAuth.
  
  test('Dashboard loads and displays fleet KPIs', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/');
    
    // In a real test, we would first login. For now, we assume the test setup handles it or we expect a redirect.
    // Assuming we land on dashboard after auth:
    if (page.url().includes('/login')) {
      await page.fill('input[name="username"]', process.env.TEST_USERNAME as string);
      await page.fill('input[name="password"]', process.env.TEST_PASSWORD as string);
      await page.click('button[type="submit"]');
    }
    
    // Check dashboard elements
    await expect(page.getByRole('heading', { name: 'Fleet Overview' })).toBeVisible({ timeout: 10000 });
    
    // Ensure KPI cards are present
    await expect(page.getByText('Total Vehicles')).toBeVisible();
    await expect(page.getByText('Net Profit')).toBeVisible();
    await expect(page.getByText('Total Revenue')).toBeVisible();
  });

  test('Navigate to Vehicles and View Profile', async ({ page }) => {
    await page.goto('/vehicles');
    
    // Wait for the table to load
    await expect(page.getByRole('table')).toBeVisible();
    
    // Click on the first vehicle (assuming there's data)
    const firstVehicleRow = page.locator('tbody tr').first();
    await expect(firstVehicleRow).toBeVisible();
    
    // Click the row to navigate to profile
    await firstVehicleRow.click();
    
    // Expect to be on a profile page
    await expect(page.getByRole('heading', { name: 'Vehicle Profile' })).toBeVisible();
    
    // Check for health and replacement cards
    await expect(page.getByText('Vehicle Health')).toBeVisible();
    await expect(page.getByText('Replacement Analysis')).toBeVisible();
  });

  test('Open Command Palette', async ({ page }) => {
    await page.goto('/');
    
    // Press Cmd+K or Ctrl+K
    await page.keyboard.press('Control+k');
    
    // Expect the command palette to open
    const palette = page.getByPlaceholder('Search vehicles, transactions, repairs...');
    await expect(palette).toBeVisible();
    
    // Type something
    await palette.fill('CR01');
    
    // Expect some results
    await expect(page.getByRole('option')).toHaveCount(1, { timeout: 5000 }); // Assuming it finds the vehicle or transaction
  });
});
