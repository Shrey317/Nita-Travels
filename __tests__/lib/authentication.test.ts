import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

const mocks = vi.hoisted(() => ({
  check: vi.fn(), clear: vi.fn(), account: vi.fn(), administrator: vi.fn(),
  authorize: undefined as undefined | ((credentials: Record<string, unknown>, request: Request) => Promise<unknown>),
  session: undefined as undefined | ((args: { session: Session; token: JWT }) => Promise<Session>),
}));
vi.mock('@/lib/rate-limit', () => ({ checkLoginRateLimit: mocks.check, clearLoginRateLimit: mocks.clear, getClientIp: () => 'fixture-ip' }));
vi.mock('@/lib/db/client', () => ({ prisma: { staffAccount: { findUnique: mocks.account }, administratorCredential: { findUnique: mocks.administrator } } }));
vi.mock('next-auth/providers/credentials', () => ({ default: (config: { authorize: typeof mocks.authorize }) => config }));
vi.mock('next-auth', () => ({ default: (config: { providers: { authorize: typeof mocks.authorize }[]; callbacks: { session: typeof mocks.session } }) => {
  mocks.authorize = config.providers[0]!.authorize;
  mocks.session = config.callbacks.session;
  return {};
} }));
import '@/auth';

describe('real credential authorization', () => {
  const request = new Request('http://localhost/api/auth/callback/credentials');
  beforeEach(async () => {
    vi.clearAllMocks();
    mocks.administrator.mockResolvedValue(null);
    vi.stubEnv('ADMIN_USERNAME', 'release-admin');
    vi.stubEnv('ADMIN_PASSWORD_HASH', await bcrypt.hash('fixture-password', 4));
    mocks.check.mockResolvedValue({ allowed: true });
    mocks.clear.mockResolvedValue(undefined);
    mocks.account.mockResolvedValue(null);
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
  it('rejects pending and disabled managers even with the correct password', async () => {
    const passwordHash = await bcrypt.hash('manager-fixture-password', 4);
    for (const status of ['PENDING', 'DISABLED']) {
      mocks.account.mockResolvedValue({ id: 'manager', status, passwordHash });
      expect(await mocks.authorize!({ username: 'manager@example.com', password: 'manager-fixture-password' }, request)).toBeNull();
    }
    expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('assigns active accounts the manager role regardless of submitted role', async () => {
    mocks.account.mockResolvedValue({ id: 'manager', name: 'Manager', email: 'manager@example.com', status: 'ACTIVE', sessionVersion: 2, passwordHash: await bcrypt.hash('manager-fixture-password', 4) });
    expect(await mocks.authorize!({ username: 'manager@example.com', password: 'manager-fixture-password', role: 'ADMIN' }, request)).toMatchObject({ id: 'manager', role: 'MANAGER', sessionVersion: 2 });
  });
  it('uses the database password after administrator recovery is verified', async () => {
    mocks.administrator.mockResolvedValue({ id: 'admin', email: 'owner@example.test', emailVerifiedAt: new Date(), sessionVersion: 4, passwordHash: await bcrypt.hash('database-admin-password', 4) });
    expect(await mocks.authorize!({ username: 'release-admin', password: 'fixture-password' }, request)).toBeNull();
    expect(await mocks.authorize!({ username: 'release-admin', password: 'database-admin-password' }, request)).toMatchObject({ id: 'admin', role: 'ADMIN', sessionVersion: 4 });
  });
  it('revokes an administrator session after its database version changes', async () => {
    mocks.administrator.mockResolvedValue({ emailVerifiedAt: new Date(), sessionVersion: 4 });
    const session = await mocks.session!({ session: { user: { name: 'Admin' }, expires: '' }, token: { sub: 'admin', sessionVersion: 3 } });
    expect(session.user).toBeUndefined();
  });
});

describe('manager session revocation', () => {
  beforeEach(() => vi.clearAllMocks());

  const evaluateSession = () => mocks.session!({
    session: { user: { name: 'Manager', email: 'manager@example.com' }, expires: '2030-01-01T00:00:00.000Z' },
    token: { sub: 'manager', staffRole: 'MANAGER', sessionVersion: 2 },
  });

  it('keeps an active manager signed in when the session version matches', async () => {
    mocks.account.mockResolvedValue({ status: 'ACTIVE', sessionVersion: 2 });
    expect(await evaluateSession()).toMatchObject({
      user: { email: 'manager@example.com' }, staffId: 'manager', staffRole: 'MANAGER', sessionVersion: 2,
    });
    expect(mocks.account).toHaveBeenCalledWith({
      where: { id: 'manager' }, select: { status: true, sessionVersion: true },
    });
  });

  it.each([
    ['disabled', { status: 'DISABLED', sessionVersion: 2 }],
    ['removed', null],
    ['version changed', { status: 'ACTIVE', sessionVersion: 3 }],
  ])('clears the authenticated user when the manager account is %s', async (_reason, account) => {
    mocks.account.mockResolvedValue(account);
    expect((await evaluateSession()).user).toBeUndefined();
  });
});
