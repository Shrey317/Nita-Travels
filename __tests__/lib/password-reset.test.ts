import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ account: vi.fn(), create: vi.fn(), revoke: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ prisma: { staffAccount: { findUnique: mocks.account }, administratorCredential: { findUnique: vi.fn().mockResolvedValue(null) }, passwordReset: { create: mocks.create, updateMany: mocks.revoke } } }));
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail: mocks.send }) } }));
import { requestPasswordReset, hashResetToken } from '@/lib/password-reset';
describe('password recovery delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GMAIL_USER', 'sender@example.test'); vi.stubEnv('GMAIL_APP_PASSWORD', 'synthetic-secret'); vi.stubEnv('AUTH_URL', 'https://fleet.example.test');
    mocks.account.mockResolvedValue({ id: 'staff', email: 'manager@example.test', status: 'ACTIVE', sessionVersion: 3 });
    mocks.create.mockResolvedValue({}); mocks.send.mockResolvedValue({}); mocks.revoke.mockResolvedValue({ count: 1 });
  });
  afterEach(() => vi.unstubAllEnvs());
  it('stores only a token hash and sends a fragment link on the configured origin', async () => {
    await requestPasswordReset('manager@example.test');
    const message = mocks.send.mock.calls[0]![0];
    const link = new URL(message.text.match(/https:\/\/\S+/)[0]);
    expect(link.origin).toBe('https://fleet.example.test');
    expect(link.pathname).toBe('/reset-password');
    expect(link.search).toBe('');
    expect(mocks.create.mock.calls[0]![0].data).toMatchObject({ tokenHash: hashResetToken(link.hash.slice(1)), staffId: 'staff', sessionVersion: 3 });
    expect(message.to).toBe('manager@example.test');
  });
  it('does not send to missing or disabled accounts', async () => {
    for (const account of [null, { status: 'DISABLED' }, { status: 'PENDING' }]) {
      mocks.account.mockResolvedValue(account); await requestPasswordReset('manager@example.test');
    }
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('revokes the issued token when SMTP delivery fails', async () => {
    mocks.send.mockRejectedValue(new Error('SMTP failure'));
    await expect(requestPasswordReset('manager@example.test')).rejects.toThrow('Recovery delivery failed');
    expect(mocks.revoke).toHaveBeenCalledOnce();
  });
});
