import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers';

const routes = ['/login', '/', '/vehicles', '/vehicles/new', '/vehicles/CR91', '/vehicles/CR91/edit', '/vehicles/CR91/notes/new', '/transactions', '/transactions/new', '/mileage', '/mileage/new', '/repairs', '/service', '/notes', '/weekly', '/monthly', '/analytics', '/alerts', '/reports', '/replacement', '/data-quality'];
for (const theme of ['light', 'dark']) {
  test(`${theme} accessibility and rendered charts`, async ({ page, context }) => {
    test.setTimeout(300000);
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const loginPage = await context.newPage();
    await loginPage.goto('/login');
    expect.soft((await new AxeBuilder({ page: loginPage }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await loginPage.close();
    await login(page);
    for (const route of routes.filter(route => route !== '/login')) {
      // Axe creates temporary frames; isolate each scan from subsequent navigation.
      const scanPage = await context.newPage();
      await scanPage.goto(route);
      await expect(scanPage.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(scanPage.locator('fieldset[aria-busy="true"]')).toHaveCount(0);
      const results = await new AxeBuilder({ page: scanPage }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect.soft(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })), `${theme} ${route}`).toEqual([]);
      for (const image of await scanPage.locator('main img').all()) await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBeTruthy();
      if (['/', '/weekly', '/monthly', '/analytics'].includes(route)) {
        await expect(scanPage.locator('.recharts-surface').first()).toBeVisible();
        expect((await scanPage.locator('.recharts-surface').first().boundingBox())?.height).toBeGreaterThan(40);
      }
      await scanPage.close();
    }
    const background = await page.locator('body').evaluate(node => getComputedStyle(node).backgroundColor);
    expect(background).toBe(theme === 'dark' ? 'rgb(5, 10, 20)' : 'rgb(245, 247, 251)');
  });
}
