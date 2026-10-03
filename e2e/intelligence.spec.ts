import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { REPORT_TYPES } from '../lib/reports';

test.beforeEach(async ({ page }) => login(page));

test('dashboard, analytics and every report reconcile to the same selection', async ({ page }) => {
  const query = 'range=12-months&vehicleId=CR91';
  const analyticsResponse = await page.request.get(`/api/analytics?${query}`);
  expect(analyticsResponse.ok()).toBeTruthy();
  const analytics = await analyticsResponse.json();
  const dashboardResponse = await page.request.get(`/api/dashboard?${query}`);
  expect(dashboardResponse.ok()).toBeTruthy();
  const dashboard = await dashboardResponse.json();
  expect(dashboard.kpis).toMatchObject(analytics.current.totals);
  expect(analytics.current.totals.netProfitCents).toBe(analytics.current.totals.incomeCents - analytics.current.totals.expenseCents);
  await page.goto(`/reports?${query}`);
  await expect(page.getByRole('link', { name: 'Download CSV', exact: true })).toHaveCount(7);
  for (const [type] of REPORT_TYPES) {
    const response = await page.request.get(`/api/reports/export?${query}&type=${type}`);
    expect(response.ok(), type).toBeTruthy();
    expect(response.headers()['content-type']).toContain('text/csv');
    const csv = await response.text();
    expect(csv).toContain(`Report,${type}`);
    expect(csv).not.toMatch(/NaN|Infinity|\[object Object\]/);
    if (type === 'financial') expect(csv).toContain(`incomeCents,${analytics.current.totals.incomeCents},`);
  }
});

test('custom period filters apply and comparison controls update their table', async ({ page }) => {
  await page.goto('/analytics?range=12-months');
  await page.getByLabel('Period', { exact: true }).selectOption('custom');
  await page.getByLabel('From', { exact: true }).fill('2025-01-15');
  await page.getByLabel('To', { exact: true }).fill('2025-02-10');
  await page.getByLabel('Compare with', { exact: true }).selectOption('previous-year');
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click();
  await expect(page).toHaveURL(/dateFrom=2025-01-15/);
  await expect(page.getByRole('form', { name: 'Analytics filters' })).toContainText('2025-01-15 – 2025-02-10');
  const comparison = page.getByRole('group', { name: 'Compare vehicles side by side' });
  await comparison.getByLabel('CR93', { exact: true }).check();
  await expect(comparison.getByRole('columnheader', { name: 'CR93', exact: true })).toBeVisible();
  await comparison.getByLabel('CR91', { exact: true }).uncheck();
  await expect(comparison.getByRole('columnheader', { name: 'CR91', exact: true })).toHaveCount(0);
});

test('invalid date, export type and vehicle references are rejected', async ({ page }) => {
  for (const path of ['/api/analytics?range=custom&dateFrom=2025-02-30&dateTo=2025-03-01', '/api/reports/export?type=invalid']) {
    expect((await page.request.get(path)).status()).toBe(400);
  }
  const result = await page.request.post('/api/transactions', { data: { vehicleId: 'CR99', date: '2025-01-01', category: 'Income', incomeZarCents: 100, expenseZarCents: 0 } });
  expect([400, 404]).toContain(result.status());
});
