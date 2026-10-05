import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { databaseIdentity, assertTestEnvironment } from '../lib/test-environment';

function readEnv(file: string): Record<string, string> {
  if (!existsSync(file)) return {};
  return Object.fromEntries(readFileSync(file, 'utf8').split(/\r?\n/).flatMap(line => {
    const match = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
    return match ? [[match[1]!, match[2]!.trim().replace(/^(['"])(.*)\1$/, '$2')]] : [];
  }));
}

function run(module: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(process.execPath, [require.resolve(module), ...args], { env, stdio: 'inherit' });
  if (result.error || result.status !== 0) throw new Error(`Test command failed (${result.status ?? 'startup'}).`);
}

async function main() {
  const mode = process.argv[2];
  if (mode !== 'integration' && mode !== 'e2e') throw new Error('Usage: tsx scripts/safe-exec.ts integration|e2e [test arguments]');
  const supplied = { ...readEnv('.env.test'), ...process.env };
  if (supplied.ALLOW_DESTRUCTIVE_TEST_DB !== 'true') throw new Error('Set ALLOW_DESTRUCTIVE_TEST_DB=true to create an isolated disposable test schema.');
  if (supplied.VERCEL_ENV === 'production') throw new Error('Tests cannot run in a production deployment.');
  const target = supplied.TEST_DATABASE_URL;
  if (!target) throw new Error('TEST_DATABASE_URL is required.');
  const identity = databaseIdentity(target);
  const productionUrls = [process.env.DATABASE_URL, process.env.DIRECT_URL, ...['.env', '.env.local', '.env.prod', '.env.production', '.env.production.local'].flatMap(file => {
    const env = readEnv(file);
    return [env.DATABASE_URL, env.DIRECT_URL];
  })].filter((value): value is string => !!value);
  if (productionUrls.some(url => databaseIdentity(url) === identity)) throw new Error('SAFETY ABORT: The test target matches a configured application database.');
  const schema = `nita_test_${Date.now()}_${randomBytes(4).toString('hex')}`;
  const testUrl = new URL(target);
  testUrl.searchParams.set('schema', schema);
  const directUrl = new URL(supplied.TEST_DIRECT_URL || target);
  if (databaseIdentity(directUrl.toString()) !== identity) throw new Error('Test pooled and direct database identities differ.');
  directUrl.searchParams.set('schema', schema);
  const env: NodeJS.ProcessEnv = {
    ...supplied,
    APP_ENV: 'test', TEST_DB_APPROVED: 'true', TEST_DATABASE_SCHEMA: schema,
    TEST_DATABASE_IDENTITY: identity, TEST_DATABASE_URL: testUrl.toString(),
    DATABASE_URL: testUrl.toString(), DIRECT_URL: directUrl.toString(),
    NEXTAUTH_URL: 'http://127.0.0.1:3100', AUTH_TRUST_HOST: 'true',
    NEXTAUTH_SECRET: randomBytes(32).toString('hex'),
    TEST_USERNAME: supplied.TEST_USERNAME || 'fleet-test',
    TEST_PASSWORD: supplied.TEST_PASSWORD || randomBytes(18).toString('base64url'),
    NITA_E2E_AUTH: mode === 'e2e' ? 'true' : 'false',
    BLOB_READ_WRITE_TOKEN: '', TZ: 'UTC',
  };
  // Exercise the real credential and rate-limit path with synthetic credentials.
  env.ADMIN_USERNAME = env.TEST_USERNAME;
  // Next's dotenv expansion also sees inherited values when a local .env exists.
  // Escape bcrypt's dollars; authorize normalizes these for either environment source.
  env.ADMIN_PASSWORD_HASH = (await bcrypt.hash(env.TEST_PASSWORD!, 10)).replace(/\$/g, '\\$');
  env.AUTH_SECRET = env.NEXTAUTH_SECRET;
  assertTestEnvironment(env, true);
  const client = new PrismaClient({ datasources: { db: { url: directUrl.toString() } } });
  let created = false;
  try {
    const result = await client.$queryRaw<Array<{ db: string }>>`SELECT current_database() AS db`;
    if (result[0]?.db !== decodeURIComponent(testUrl.pathname.slice(1))) throw new Error('Connected database differs from requested test identity.');
    // Only the identifier generated above is interpolated. Existing schemas are never reset.
    await client.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    created = true;
    console.info(`Isolated test schema: ${schema}`);
    run('prisma/build/index.js', ['migrate', 'deploy'], env);
    if (mode === 'integration') run(join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs'), ['run', '--config', 'vitest.integration.config.mts', ...process.argv.slice(3)], env);
    else run('@playwright/test/cli', ['test', ...process.argv.slice(3)], env);
  } finally {
    if (created) await client.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await client.$disconnect();
  }
}

main().catch(error => {
  // Prisma errors can contain connection details. Keep diagnostics safe for CI logs.
  console.error(error instanceof Error && !error.message.includes('prisma.') ? error.message : 'Test database unavailable or isolated schema setup failed. Verify test credentials and network access.');
  process.exitCode = 1;
});
