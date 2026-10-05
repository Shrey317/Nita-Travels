import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const mocks = vi.hoisted(() => ({
  check: vi.fn(), clear: vi.fn(),
  authorize: undefined as undefined | ((credentials: Record<string, unknown>, request: Request) => Promise<unknown>),
}));
vi.mock('@/lib/rate-limit', () => ({ checkLoginRateLimit: mocks.check, clearLoginRateLimit: mocks.clear, getClientIp: () => 'fixture-ip' }));
vi.mock('next-auth/providers/credentials', () => ({ default: (config: { authorize: typeof mocks.authorize }) => config }));
vi.mock('next-auth', () => ({ default: (config: { providers: { authorize: typeof mocks.authorize }[] }) => {
  mocks.authorize = config.providers[0]!.authorize;
  return {};
} }));
import '@/auth';

describe('real credential authorization', () => {
  const request = new Request('http://localhost/api/auth/callback/credentials');
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv('ADMIN_USERNAME', 'release-admin');
    vi.stubEnv('ADMIN_PASSWORD_HASH', await bcrypt.hash('fixture-password', 4));
    mocks.check.mockResolvedValue({ allowed: true });
    mocks.clear.mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllEnvs());
  it('accepts the configured password and clears earlier failed attempts', async () => {
    expect(await mocks.authorize!({ username: 'release-admin', password: 'fixture-password' }, request)).toMatchObject({ id: 'admin' });
    expect(mocks.check).toHaveBeenCalledWith('release-admin:fixture-ip');
    expect(mocks.clear).toHaveBeenCalledWith('release-admin:fixture-ip');
  });
  it('rejects incorrect credentials without clearing failures', async () => {
    expect(await mocks.authorize!({ username: 'release-admin', password: 'wrong' }, request)).toBeNull();
    expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('denies even the correct password during a temporary rate limit', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mocks.check.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });
    expect(await mocks.authorize!({ username: 'release-admin', password: 'fixture-password' }, request)).toBeNull();
    expect(mocks.clear).not.toHaveBeenCalled();
    warning.mockRestore();
  });
  it('does not grant a test-credential bypass when test flags are set', async () => {
    vi.stubEnv('APP_ENV', 'test'); vi.stubEnv('NITA_E2E_AUTH', 'true');
    vi.stubEnv('TEST_USERNAME', 'test-only'); vi.stubEnv('TEST_PASSWORD', 'test-password');
    expect(await mocks.authorize!({ username: 'test-only', password: 'test-password' }, request)).toBeNull();
    expect(mocks.check).toHaveBeenCalled();
  });
  it('rejects malformed or oversized credentials before database access', async () => {
    for (const credentials of [{ username: '', password: 'a' }, { username: 42, password: 'a' }, { username: 'x', password: 'a'.repeat(1025) }]) {
      expect(await mocks.authorize!(credentials, request)).toBeNull();
    }
    expect(mocks.check).not.toHaveBeenCalled();
  });
});
