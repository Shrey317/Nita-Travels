import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { login } from './helpers';
import { prisma } from '../lib/db/client';
test('RTO setup, payment allocation, private bank records and responsive dashboard', async ({ page }) => {
  await login(page);
  await prisma.vehicle.create({ data: { id: 'CR77', make: 'Suzuki', model: 'S-Presso', registration: 'TEST-RTO-77', transmission: 'Manual', purchaseDate: new Date('2025-01-01'), purchasePriceCents: 10000000, mileageAtPurchaseKm: 10000, currentMileageKm: 10000, assignments: { create: { module: 'NORMAL_RENTAL', startsAt: new Date('2025-01-01') } } } });
  const post = async (path: string, data: unknown) => { const response = await page.request.post(path, { data }); expect(response.ok(), await response.text()).toBeTruthy(); return (await response.json()).result; };
  const driver = await post('/api/rent-to-own/drivers', { name: 'Browser test driver', phone: '000', licenceReference: 'TEST' });
  await post('/api/rent-to-own/transfer', { vehicleId: 'CR77', toModule: 'RENT_TO_OWN', effectiveAt: '2025-02-01', odometerKm: 10000, condition: 'Good', resolution: 'Hire resolved' });
  const agreement = await post('/api/rent-to-own/agreements', { number: 'BROWSER-RTO-77', vehicleId: 'CR77', driverId: driver.id, modelYear: 2025, startDate: '2025-02-01', weeklyAmount: '2850' });
  await page.goto(`/rent-to-own/agreements/${agreement.id}?tab=documents`);
  await expect(page.getByRole('heading', { name: 'BROWSER-RTO-77' })).toBeVisible();
  await page.getByLabel('File', { exact: true }).setInputFiles({ name: 'signed.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nSynthetic signed document') });
  await page.getByRole('button', { name: 'Attach document', exact: true }).click();
  await expect(page.getByText('Document attached.', { exact: true })).toBeVisible();
  await post('/api/rent-to-own/payments', { agreementId: agreement.id, date: '2025-02-01', amount: '8000', kind: 'UPFRONT', reference: 'browser-upfront', method: 'EFT', idempotencyKey: randomUUID() });
  await post('/api/rent-to-own/status', { agreementId: agreement.id, status: 'ACTIVE', reason: 'Signed approved contract' });
  await post('/api/rent-to-own/payments', { agreementId: agreement.id, date: '2025-02-08', amount: '2850', kind: 'RENT', reference: 'browser-rent', method: 'EFT', idempotencyKey: randomUUID() });
  await page.goto('/rent-to-own?from=2025-02-01&to=2025-02-28');
  await expect(page.getByRole('link', { name: 'BROWSER-RTO-77' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => {
    if (document.documentElement.scrollWidth <= window.innerWidth) return [];
    return Array.from(document.querySelectorAll('section,form,nav,main,div'))
      .filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.overflow-x-auto'))
      .slice(0, 12).map(e => `${e.tagName}.${e.className}: ${e.getBoundingClientRect().width}/${e.getBoundingClientRect().right}`);
  })).toEqual([]);
  const finance = await post('/api/bank-finance/agreements', { vehicleId: 'CR77', bank: 'Private Test Bank', reference: 'PRIVATE-77', startDate: '2025-01-01', firstDueDate: '2025-02-01', originalPrincipal: '100000', monthlyAmount: '2500', termMonths: 60, maturityDate: '2030-01-01' });
  await page.goto(`/bank-finance/${finance.id}`);
  await expect(page.getByText('Not Yet Verified', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CR77 · Private Test Bank' })).toBeVisible();
  const exportResponse = await page.request.get(`/api/bank-finance/export?id=${finance.id}`); expect(exportResponse.status()).toBe(200);
});
test('manager sessions cannot read or write private bank finance', async ({ page }) => {
  await prisma.vehicle.update({ where: { id: 'CR77' }, data: { financeBank: 'SECRET LEGACY BANK', financePolicyNumber: 'HIDDEN-REFERENCE-77', targetEmiCents: 450000, emiMonthsTotal: 60 } });
  const email = 'rto-manager@test.invalid'; const password = 'Synthetic-password-77!';
  await prisma.staffAccount.create({ data: { email, name: 'RTO test manager', passwordHash: await bcrypt.hash(password, 10), status: 'ACTIVE' } });
  await page.goto('/login'); await page.getByLabel('Username', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(password); await page.getByRole('button', { name: 'Sign In', exact: true }).click(); await expect(page).toHaveURL(/\/$/);
  expect((await page.request.get('/api/bank-finance/export?id=unknown')).status()).toBe(403);
  expect((await page.request.post('/api/bank-finance/payments', { data: {} })).status()).toBe(403);
  expect((await page.request.get('/api/private-documents?scope=BANK&id=unknown')).status()).toBe(403);
  const detail = await page.request.get('/api/vehicles/CR77'); expect(await detail.text()).not.toContain('HIDDEN-REFERENCE-77'); expect((await detail.json()).vehicle.targetEmiCents).toBe(0);
  const listing = await page.request.get('/api/vehicles'); expect(await listing.text()).not.toContain('SECRET LEGACY BANK');
  expect((await page.request.patch('/api/vehicles/CR77', { data: { financePolicyNumber: 'unauthorised' } })).status()).toBe(403);
  expect((await page.request.patch('/api/vehicles/CR77', { data: { registration: 'REQUESTED-CHANGE' } })).status()).toBe(202);
  await page.goto('/approvals'); await expect(page.getByText('HIDDEN-REFERENCE-77', { exact: false })).toHaveCount(0);
  await page.goto('/vehicles/CR77/edit'); await expect(page.locator('#financePolicyNumber')).toHaveCount(0); await expect(page.locator('body')).not.toContainText('HIDDEN-REFERENCE-77');
  await page.goto('/rent-to-own'); await expect(page.getByRole('heading', { name: 'Rent-to-Own', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Private Bank Finance', exact: true })).toHaveCount(0);
});


test('business switcher separates navigation, registers and normal vehicle lists', async ({ page }) => {
  await login(page);
  await page.goto('/rent-to-own');
  const switcher = page.getByRole('navigation', { name: 'Business systems' });
  await expect(switcher.getByRole('link', { name: 'Rent-to-Own', exact: true })).toHaveAttribute('aria-current', 'true');
  const sidebar = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(sidebar.getByRole('link', { name: 'Transactions', exact: true })).toHaveCount(0);
  for (const [section, title] of [['vehicles','Vehicles'], ['agreements','Agreements & Drivers'], ['payments','Payments & Charges'], ['mileage','Mileage'], ['repairs','Repairs & Approvals'], ['service','Scheduled Servicing'], ['downtime','Downtime & Replacements'], ['documents','Documents'], ['settlements','Settlement Reviews'], ['alerts','Alerts'], ['reports','Reports']]) {
    await page.goto(`/rent-to-own/${section}`);
    await expect(page.getByRole('heading', { name: `Rent-to-Own · ${title}`, exact: true })).toBeVisible();
  }
  await page.goto('/rent-to-own/repairs');
  await page.getByText('Add or manage records — choose an agreement', { exact: true }).click();
  await page.getByRole('link', { name: 'CR77 · BROWSER-RTO-77', exact: true }).click();
  await expect(page).toHaveURL(/\/rent-to-own\/agreements\/[^?]+\?tab=repairs$/, { timeout: 30000 });
  await expect(page.locator('summary').filter({ hasText: /^Register repair quotation$/ })).toBeVisible();
  await expect(page.getByText('Record payment', { exact: true })).toHaveCount(0);
  await switcher.getByRole('link', { name: 'Normal Rental', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(sidebar.getByRole('link', { name: 'Transactions', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Payments & Charges', exact: true })).toHaveCount(0);
  const normal = await page.request.get('/api/vehicles');
  expect((await normal.json()).vehicles.some((v: { vehicle: { id: string } }) => v.vehicle.id === 'CR77')).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 });
  await switcher.getByRole('link', { name: 'Rent-to-Own', exact: true }).click();
  await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('link', { name: 'Payments', exact: true }).click();
  await expect(page).toHaveURL(/\/rent-to-own\/payments$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
