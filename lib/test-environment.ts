/** Pure checks shared by test tooling; no connection strings are logged. */
export function databaseIdentity(connection: string): string {
  const url = new URL(connection);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('PostgreSQL is required.');
  return `${url.hostname.toLowerCase().replace(/-pooler(?=\.)/, '')}:${url.port || '5432'}${url.pathname}`;
}

export function assertTestEnvironment(env: NodeJS.ProcessEnv, destructive = false) {
  if (env.APP_ENV !== 'test' || env.VERCEL_ENV === 'production') {
    throw new Error('SAFETY ABORT: An explicit non-production APP_ENV=test is required.');
  }
  if (!env.TEST_DATABASE_URL || env.DATABASE_URL !== env.TEST_DATABASE_URL) {
    throw new Error('SAFETY ABORT: DATABASE_URL must exactly match TEST_DATABASE_URL.');
  }
  const url = new URL(env.TEST_DATABASE_URL);
  const schema = env.TEST_DATABASE_SCHEMA;
  if (!schema || !/^nita_test_[a-z0-9_]+$/.test(schema) || url.searchParams.get('schema') !== schema) {
    throw new Error('SAFETY ABORT: A dedicated nita_test_ schema is required. Use the test runner.');
  }
  if (env.TEST_DB_APPROVED !== 'true' || !env.TEST_DATABASE_IDENTITY || databaseIdentity(env.TEST_DATABASE_URL) !== env.TEST_DATABASE_IDENTITY) {
    throw new Error('SAFETY ABORT: Database identity must be verified by the test runner.');
  }
  if (env.PRODUCTION_DATABASE_IDENTITY === env.TEST_DATABASE_IDENTITY) {
    throw new Error('SAFETY ABORT: Test and production database targets match.');
  }
  if (destructive && env.ALLOW_DESTRUCTIVE_TEST_DB !== 'true') {
    throw new Error('SAFETY ABORT: ALLOW_DESTRUCTIVE_TEST_DB=true is required for mutations.');
  }
  return { database: decodeURIComponent(url.pathname.slice(1)), schema };
}
