import { test, expect } from '@playwright/test';

test.describe('Core Fleet Workflow', () => {
  // We need to bypass or mock auth for this E2E test, or log in if an auth fixture exists.
  // Assuming a seeded test user or mocking session since it's NextAuth.
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    if (page.url().includes('/login')) {
      await page.fill('input[name="username"]', process.env.TEST_USERNAME as string);
      await page.fill('input[name="password"]', process.env.TEST_PASSWORD as string);
      await page.click('button[type="submit"]');
      // Wait for navigation to complete and land on dashboard or any protected page
      await page.waitForURL('**/', { timeout: 10000 }).catch(() => {});
    }
  });

  test('Dashboard loads and displays fleet KPIs', async ({ page }) => {
    // Navigate to dashboard explicitly to ensure we're there
    await page.goto('/');
    
    // Check dashboard elements
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    
    // Ensure KPI cards are present
    await expect(page.getByText('Active Fleet')).toBeVisible();
    await expect(page.getByText('Net Profit')).toBeVisible();
    await expect(page.getByText('Total Income')).toBeVisible();
  });

  test('Navigate to Vehicles and View Profile', async ({ page }) => {
    await page.goto('/vehicles');
    
    // The page defaults to grid view, so find the first link to a specific vehicle profile
    const firstVehicleLink = page.locator('a[href^="/vehicles/"]').filter({ hasNotText: 'Add Vehicle' }).first();
    await expect(firstVehicleLink).toBeVisible({ timeout: 15000 });
    
    // Click the card to navigate to profile
    await firstVehicleLink.click();
    
    // Expect to be on a profile page by checking for the Identity & Specs card
    await expect(page.getByText('Identity & Specs')).toBeVisible({ timeout: 15000 });
    
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
    await palette.fill('CR');
    
    // Expect some results (Command Palette debounces 300ms + server action)
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 15000 });
  });
});
