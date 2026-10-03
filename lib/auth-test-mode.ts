/** Test credentials are available only with the isolated test runner's explicit database guard. */
export function isIsolatedTestAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.NITA_E2E_AUTH !== "true" || env.APP_ENV !== "test" || env.TEST_DB_APPROVED !== "true" ||
    env.VERCEL_ENV === "production" || !env.TEST_DATABASE_URL || env.DATABASE_URL !== env.TEST_DATABASE_URL ||
    !env.TEST_USERNAME || !env.TEST_PASSWORD || !env.TEST_DATABASE_SCHEMA) return false;
  try {
    const schema = new URL(env.TEST_DATABASE_URL).searchParams.get("schema");
    return !!schema && /^nita_test_[a-z0-9_]+$/.test(schema) && schema === env.TEST_DATABASE_SCHEMA;
  } catch { return false; }
}

