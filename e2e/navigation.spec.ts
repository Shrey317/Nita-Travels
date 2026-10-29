import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('forms wait for client handlers and retain the first value on a slow connection', async ({ page }) => {
  await login(page);
  let release!: () => void;
  const blocked = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.pathname.startsWith('/_next/static/') && url.pathname.endsWith('.js'), async route => {
    await blocked;
    await route.continue().catch(() => {});
  });
  try {
    await page.goto('/vehicles/new', { waitUntil: 'commit' });
    await expect(page.getByLabel('Vehicle ID', { exact: true })).toBeDisabled();
  } finally { release(); }
  const id = page.getByLabel('Vehicle ID', { exact: true });
  await expect(id).toBeEnabled();
  await id.fill('CR89');
  await page.getByRole('button', { name: 'Add Vehicle', exact: true }).click();
  await expect(page.locator('#make-error')).toBeVisible();
  await expect(id).toHaveValue('CR89');
  await expect(id).toHaveAttribute('aria-invalid', 'false');
});

test('dashboard document and images finish loading after login', async ({ page }) => {
  await login(page);
  const pending = new Set<string>();
  const key = (url: string) => { const value = new URL(url); return value.pathname; };
  page.on('request', request => pending.add(key(request.url())));
  page.on('requestfinished', request => pending.delete(key(request.url())));
  page.on('requestfailed', request => pending.delete(key(request.url())));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  try { await page.waitForLoadState('load', { timeout: 15000 }); }
  catch {
    const images = await page.locator('img').evaluateAll(nodes => nodes
      .filter((node): node is HTMLImageElement => node instanceof HTMLImageElement)
      .map(node => ({ path: new URL(node.currentSrc || node.src).pathname, complete: node.complete, width: node.naturalWidth })));
    throw new Error(`Dashboard load event did not finish. Pending paths: ${[...pending].join(', ')}. Image state: ${JSON.stringify(images)}`);
  }
  for (const image of await page.locator('main img').all()) await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBeTruthy();
});
