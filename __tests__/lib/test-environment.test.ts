import { describe, expect, it } from 'vitest';
import { assertTestEnvironment, databaseIdentity } from '@/lib/test-environment';

const url = 'postgresql://user:password@localhost:5432/nita_test?schema=nita_test_fixture';
const safe: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'test', DATABASE_URL: url, TEST_DATABASE_URL: url,
  TEST_DATABASE_SCHEMA: 'nita_test_fixture', TEST_DB_APPROVED: 'true',
  TEST_DATABASE_IDENTITY: databaseIdentity(url), ALLOW_DESTRUCTIVE_TEST_DB: 'true',
};

describe('isolated test environment', () => {
  it('accepts an explicitly verified dedicated schema', () => {
    expect(assertTestEnvironment(safe, true).schema).toBe('nita_test_fixture');
  });
  it.each([
    { APP_ENV: undefined }, { VERCEL_ENV: 'production' }, { TEST_DB_APPROVED: undefined },
    { TEST_DATABASE_SCHEMA: 'public' }, { DATABASE_URL: 'postgresql://localhost/other' },
    { TEST_DATABASE_IDENTITY: 'wrong' }, { ALLOW_DESTRUCTIVE_TEST_DB: undefined },
    { PRODUCTION_DATABASE_IDENTITY: databaseIdentity(url) },
  ])('rejects unsafe configuration %j', override => {
    expect(() => assertTestEnvironment({ ...safe, ...override }, true)).toThrow();
  });
  it('treats pooled and direct Neon hosts as the same target, ignoring credentials/schema', () => {
    expect(databaseIdentity('postgresql://one:a@ep-example-pooler.neon.tech/neondb?schema=one'))
      .toBe(databaseIdentity('postgresql://two:b@ep-example.neon.tech/neondb?schema=two'));
  });
});
