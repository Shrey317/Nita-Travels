import { test, expect } from '@playwright/test';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import { login } from './helpers';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4ioAAAAASUVORK5CYII=', 'base64');
const file = (name = 'receipt.png') => ({ name, mimeType: 'image/png', buffer: png });

test('upload endpoint denies unauthenticated, unsigned and malformed requests', async ({ request, page }) => {
  const tokenRequest = { type: 'blob.generate-client-token', payload: { pathname: 'receipt.png', multipart: false, clientPayload: null } };
  expect((await request.post('/api/upload', { data: tokenRequest })).status()).toBe(401);
  await login(page);
  expect((await page.request.post('/api/upload', { data: { ...tokenRequest, payload: { ...tokenRequest.payload, pathname: 'attack.svg' } } })).status()).toBe(400);
  expect((await page.request.post('/api/upload', { data: 'invalid JSON', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400);
  expect((await page.request.post('/api/upload', { data: { type: 'blob.upload-completed', payload: { blob: { url: 'https://fixture.public.blob.vercel-storage.com/a.png', downloadUrl: 'https://fixture.public.blob.vercel-storage.com/a.png', pathname: 'a.png', contentDisposition: 'inline' } } } })).status()).toBe(401);
});

test('invalid files, provider errors and cancellation leave the form usable', async ({ page }) => {
  await login(page);
  await page.goto('/vehicles/CR91/notes/new');
  const input = page.locator('main input[type="file"]');
  await input.setInputFiles({ name: 'attack.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') });
  await expect(page.getByText(/Choose a JPEG/)).toBeVisible();
  await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(10485761) });
  await expect(page.getByText(/no larger than 10 MB/)).toBeVisible();
  await page.route('**/api/upload', route => route.fulfill({ status: 500, json: { error: 'Simulated storage failure' } }));
  await input.setInputFiles(file());
  await expect(page.getByRole('button', { name: 'Add photo or PDF' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Add Note', exact: true })).toBeEnabled();
  await page.unroute('**/api/upload');
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/upload', async route => { await pending; await route.abort().catch(() => {}); });
  await input.setInputFiles(file());
  await expect(page.getByRole('button', { name: 'Add Note', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add photo or PDF' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel upload', exact: true }).click();
  release();
  await expect(page.getByText('Upload cancelled', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add Note', exact: true })).toBeEnabled();
});

test('simulated Blob transport preserves attachment order through actual note persistence', async ({ page }) => {
  await login(page);
  const urls: string[] = [];
  await page.route('**/api/upload', async route => {
    const { payload } = route.request().postDataJSON();
    const clientToken = await generateClientTokenFromReadWriteToken({ token: 'vercel_blob_rw_releasefixture_local-only-test-secret', pathname: payload.pathname, allowedContentTypes: ['image/png'], maximumSizeInBytes: 10485760, validUntil: Date.now() + 60000 });
    await route.fulfill({ json: { type: 'blob.generate-client-token', clientToken } });
  });
  await page.route('https://vercel.com/api/blob/**', async route => {
    const pathname = new URL(route.request().url()).searchParams.get('pathname')!;
    const url = `https://releasefixture.public.blob.vercel-storage.com/${pathname}`;
    urls.push(url);
    await route.fulfill({ headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'PUT, OPTIONS', 'Access-Control-Allow-Headers': '*' }, json: { url, downloadUrl: url, pathname, contentType: 'image/png', contentDisposition: 'inline' } });
  });
  await page.route('**/_next/image?*', route => route.fulfill({ contentType: 'image/png', body: png }));
  await page.goto('/vehicles/CR91/notes/new');
  await page.getByLabel('Note', { exact: true }).fill(`Upload fixture ${Date.now()}`);
  await page.locator('main input[type="file"]').setInputFiles([file('first.png'), file('second.png')]);
  await expect(page.getByRole('img', { name: 'Photos or PDFs 2 of 2', exact: true })).toBeVisible();
  const saved = page.waitForResponse(response => new URL(response.url()).pathname === '/api/notes' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Add Note', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  const data = await response.json();
  expect(urls).toHaveLength(2);
  expect(data.note.photoUrls).toEqual(urls);
  await expect(page.getByText('Note added', { exact: true })).toBeVisible();
  await page.goto('/notes?vehicleId=CR91');
  const thumbnail = page.getByRole('button', { name: /View .*1 of 2/ }).first();
  await expect(thumbnail).toBeVisible();
  await thumbnail.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
