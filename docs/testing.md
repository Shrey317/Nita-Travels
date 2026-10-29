# Testing and verification

## Commands

- `npm test`: pure and mocked Vitest suites in `__tests__/lib`; no database access.
- `npm run test:integration`: real Prisma queries and mutations in a fresh isolated PostgreSQL schema.
- `npm run test:e2e`: guarded fixture setup and Playwright workflows against a newly started **production build** at `http://127.0.0.1:3100`. Run `npm run build` first. Chromium runs the full suite; Firefox and WebKit run critical authentication, upload, financial and mutation workflows.
- `npm run typecheck`, `npm run lint`, `npm run build`: strict static checks and production compilation.

Vitest configuration is in `vitest.config.mts` and `vitest.integration.config.mts`. Type checking first generates Next.js route types. Linting uses the ESLint CLI. Use Node 22.12 or newer in the Node 22 release line for the same runtime as CI.

Use the exact version in `.nvmrc` (22.23.3 for this release). Install browsers with `npx playwright install chromium firefox webkit`. CI installs browser system dependencies too.

## Disposable database configuration

Set `TEST_DATABASE_URL` and, if needed, `TEST_DIRECT_URL` to a dedicated test database. These may be placed in git-ignored `.env.test`. Test pooled/direct URLs must identify the same database. Use a test account with schema creation privileges. Never reuse the application's development or production database. The runner compares normalized host/database identities against configured application URLs (including pooled/direct equivalents), queries the actual database name and rejects mismatches.

Explicitly set `ALLOW_TEST_MUTATIONS=true` in the test shell. This authorizes only the runner's generated `nita_test_<timestamp>_<random>` schema. The runner creates it, applies all committed migrations, runs tests, and retains that schema for inspection. It does not rename, replace or copy `.env`, and it does not clear existing database tables. Unit tests do not load `.env.test` or import the database client.

PowerShell example for a dedicated local PostgreSQL test service:

```powershell
$env:TEST_DATABASE_URL='postgresql://nita_test:test_password@127.0.0.1:5432/nita_test'
$env:TEST_DIRECT_URL=$env:TEST_DATABASE_URL
$env:ALLOW_TEST_MUTATIONS='true'
npm run test:integration
npm run test:e2e
```

The local test launcher sets `APP_ENV`, verified database identity/schema, localhost URL and a fresh session secret in the child environment. It configures the normal admin credentials with a synthetic bcrypt hash; authentication and database rate limits are exercised without a test bypass. Vercel Blob credentials are removed. Override `TEST_USERNAME`/`TEST_PASSWORD` for manual QA if desired; otherwise credentials are taken from `.env.test` or generated for that run. Each integration file and each browser project receives a fresh schema. No fixture cleanup deletes are performed.

Test namespaces intentionally remain after runs. Cleanup requires a separately authorized operational procedure; never run broad resets or deletes.

## Coverage

Pure suites cover financial arithmetic, schemas, insurance and service boundaries, mileage, safety checks, and the additional domain suites listed by Vitest. Integration suites exercise relationships, mileage mutations, weekly aggregation, notification eligibility and health metrics. Browser fixtures include multiple active/inactive vehicles, income, fleet-wide/unallocated transactions, expenses, repeat repairs, services, missing and excessive mileage, insurance/warranty metadata, deleted transactions and empty periods.

E2E covers authentication, rejection of unauthenticated requests, vehicle search/profile, keyboard search, transaction create/edit/delete/export, repair association, operational pages, weekly/monthly ranges, custom analytics dates, vehicle comparison controls, malformed inputs and reconciliation across dashboard, analytics and all seven CSV exports. Responsive route tests cover 375, 480, 768, 1024, 1280, 1440 and 1920 pixels in light and dark themes, assert no document overflow or application console/HTTP 500 errors, and retain mobile/desktop screenshots. Tables may scroll inside their own container.

Additional usability checks cover dashboard disclosures, mobile navigation and transaction cards, sorting carried between desktop and mobile, offline/reconnect feedback, Back navigation through filters, reversed date input and successful transaction persistence when browser storage is blocked. Upload tests cover invalid files, provider failure, cancellation and ordered previews and rejection of unverified objects using intercepted transport. Unit tests exercise the real Blob SDK's token restrictions and callback signatures without network access. These are explicitly separate from live-provider verification. Login tests cover real lockout recovery, concurrent attempt counts, storage failure and expired sessions. The login helper allows 30 seconds for a cold production server; other assertions keep their normal timeout.

Transaction deletion is soft deletion. Mileage browser checks verify cancellation of the destructive action; no hard-delete workflow is executed. Unit mocks separately cover mileage-chain behavior after removal.

`playwright-report` and `test-results` are git-ignored. Failure traces may contain fixture data, so keep retention short. The CI workflow uploads only these test artifacts, never environment files.

## Verification limits

A passing test suite does not substitute for reviewing screenshots, keyboard behavior, contrast or real business data reconciliation. Report actual pass/fail/skip counts from the final run. Blob upload verification requires a dedicated test Blob store; never upload fixtures into production storage.


## Environment isolation

Run `node scripts/isolated-workspace.cjs` from the repository to prepare `.local-verification` without application environment files. Build and run integration/browser commands there. The runner passes only allowlisted operating-system variables and synthetic test configuration to child processes. Local artifacts and test databases are git-ignored. An actual provider upload still requires a dedicated test Blob store.

For the isolated local build, set both `AUTH_URL` and `NEXTAUTH_URL` to `http://127.0.0.1:3100` before building. Next.js writes the CSP headers during the build: an explicitly configured loopback HTTP origin omits HTTPS upgrading so WebKit can load local resources. Non-local and unknown production origins retain HTTPS upgrading. Use the actual HTTPS public origin when building a deployment; do not deploy the local verification build.
