import { test, expect } from '@playwright/test';
import { login } from './helpers';

const routes = ['/', '/vehicles', '/vehicles/CR91', '/transactions', '/repairs', '/mileage', '/service', '/notes', '/weekly', '/monthly', '/analytics', '/alerts', '/reports', '/data-quality', '/replacement'];
for (const theme of ['light', 'dark'] as const) {
  for (const route of routes) {
    test(`${theme} responsive route ${route}`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() >= 500 && new URL(response.url()).hostname === '127.0.0.1') errors.push(`${response.status()} ${new URL(response.url()).pathname}`); });
      await page.addInitScript(value => localStorage.setItem('theme', value), theme);
      await login(page);
      const response = await page.goto(route);
      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('main')).not.toContainText(/NaN|Infinity|\[object Object\]/);
      expect(await page.locator('html').evaluate(element => element.classList.contains('dark'))).toBe(theme === 'dark');
      for (const width of [320, 375, 390, 430, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect.poll(async () => page.evaluate(() => {
          if (document.documentElement.scrollWidth <= innerWidth + 1) return [];
          return [`Document ${document.documentElement.scrollWidth}px`, ...Array.from(document.querySelectorAll('main *')).filter(element => {
            const rect = element.getBoundingClientRect();
            let ancestor = element.parentElement;
            while (ancestor && ancestor.tagName !== 'MAIN') {
              if (['auto', 'hidden', 'scroll', 'clip'].includes(getComputedStyle(ancestor).overflowX)) return false;
              ancestor = ancestor.parentElement;
            }
            return rect.right > innerWidth + 1;
          }).slice(0, 12).map(element => `${element.tagName}.${element.className} (${Math.round(element.getBoundingClientRect().right)}px)`)];
        }), { message: `Document overflow at ${width}px on ${route}` }).toEqual([]);
        if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath(`${width}.png`), fullPage: true });
      }
      expect(errors).toEqual([]);
    });
  }
}
