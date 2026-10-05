import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPayloadFromClientToken } from '@vercel/blob/client';
import { UnauthorizedError } from '@/lib/errors';

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
import { POST } from '@/app/api/upload/route';

const token = 'vercel_blob_rw_releasefixture_local-only-test-secret';
const generateBody = { type: 'blob.generate-client-token', payload: { pathname: 'receipt.png', clientPayload: 'untrusted', multipart: false } };
const callbackBody = { payload: { tokenPayload: null, blob: { pathname: 'receipt.png', url: 'https://fixture.public.blob.vercel-storage.com/receipt.png', downloadUrl: 'https://fixture.public.blob.vercel-storage.com/receipt.png?download=1', contentType: 'image/png', contentDisposition: 'inline' } }, type: 'blob.upload-completed' };
const request = (body: unknown, signature?: string) => new Request('https://fleet.example/api/upload', { method: 'POST', headers: signature ? { 'x-vercel-signature': signature } : {}, body: JSON.stringify(body) });

describe('upload authorization and real SDK signatures (no provider network)', () => {
  beforeEach(() => { vi.stubEnv('BLOB_READ_WRITE_TOKEN', token); mocks.auth.mockResolvedValue({ user: { id: 'admin' } }); });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
  it('issues an authenticated token restricted by MIME, size and server callback', async () => {
    const response = await POST(request(generateBody));
    expect(response.status).toBe(200);
    const payload = getPayloadFromClientToken((await response.json()).clientToken);
    expect(payload).toMatchObject({ allowedContentTypes: ['image/png'], maximumSizeInBytes: 10485760, addRandomSuffix: true });
    expect(payload.onUploadCompleted?.callbackUrl).toBe('https://fleet.example/api/upload');
  });
  it('rejects unauthenticated token requests and invalid extensions', async () => {
    mocks.auth.mockRejectedValueOnce(new UnauthorizedError());
    expect((await POST(request(generateBody))).status).toBe(401);
    expect((await POST(request({ ...generateBody, payload: { ...generateBody.payload, pathname: 'attack.svg' } }))).status).toBe(400);
  });
  it('accepts a correctly signed callback with original JSON ordering', async () => {
    const signature = createHmac('sha256', token).update(JSON.stringify(callbackBody)).digest('hex');
    expect((await POST(request(callbackBody, signature))).status).toBe(200);
  });
  it('rejects missing and forged completion signatures', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await POST(request(callbackBody))).status).toBe(401);
    const response = await POST(request(callbackBody, '0'.repeat(64)));
    expect(response.ok).toBe(false);
    expect(await response.text()).not.toContain(token);
  });
});
