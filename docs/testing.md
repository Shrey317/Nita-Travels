# Testing and verification

## Commands

- `npm test`: pure and mocked Vitest suites in `__tests__/lib`; no database access.
- `npm run test:integration`: real Prisma queries and mutations in a fresh isolated PostgreSQL schema.
- `npm run test:e2e`: guarded fixture setup and Playwright Chromium workflows against a newly started local application at `http://127.0.0.1:3100`.
- `npm run typecheck`, `npm run lint`, `npm run build`: strict static checks and production compilation.

Install Chromium once with `npx playwright install chromium`. CI installs browser system dependencies too.

## Disposable database configuration

Set `TEST_DATABASE_URL` and, if needed, `TEST_DIRECT_URL` to a dedicated test database. These may be placed in git-ignored `.env.test`. Test pooled/direct URLs must identify the same database. Use a test account with schema creation privileges. Never reuse the application's development or production database. The runner compares normalized host/database identities against configured application URLs (including pooled/direct equivalents), queries the actual database name and rejects mismatches.

Explicitly set `ALLOW_DESTRUCTIVE_TEST_DB=true` in the test shell. This authorizes only the runner's generated `nita_test_<timestamp>_<random>` schema. The runner creates it, applies all committed migrations, runs tests, and drops only that schema in `finally`. It does not rename, replace or copy `.env`, and it does not clear existing database tables. Unit tests do not load `.env.test` or import the database client.

PowerShell example for a dedicated local PostgreSQL test service:

```powershell
$env:TEST_DATABASE_URL='postgresql://nita_test:test_password@127.0.0.1:5432/nita_test'
$env:TEST_DIRECT_URL=$env:TEST_DATABASE_URL
$env:ALLOW_DESTRUCTIVE_TEST_DB='true'
npm run test:integration
npm run test:e2e
```

The local test launcher sets `APP_ENV`, verified database identity/schema, test authentication, localhost URL and fresh session secret in the child environment. Vercel Blob credentials are removed. The application test login only activates with all guards satisfied. Override `TEST_USERNAME`/`TEST_PASSWORD` for manual QA if desired; otherwise credentials are taken from `.env.test` or generated for that run.

If a process is forcibly killed before cleanup, a uniquely named test schema may remain. Inspect that exact schema on the dedicated test database before manually deleting it. Do not run broad resets or deletes.

## Coverage

Pure suites cover financial arithmetic, schemas, insurance and service boundaries, mileage, safety checks, and the additional domain suites listed by Vitest. Integration suites exercise relationships, mileage mutations, weekly aggregation, notification eligibility and health metrics. Browser fixtures include multiple active/inactive vehicles, income, fleet-wide/unallocated transactions, expenses, repeat repairs, services, missing and excessive mileage, insurance/warranty metadata, deleted transactions and empty periods.

E2E covers authentication, rejection of unauthenticated requests, vehicle search/profile, keyboard search, transaction create/edit/delete/export, repair association, operational pages, weekly/monthly ranges, custom analytics dates, vehicle comparison controls, malformed inputs and reconciliation across dashboard, analytics and all seven CSV exports. Responsive route tests cover 320, 375, 390, 430, 768 and 1440 pixels in light and dark themes, assert no document overflow or application console/HTTP 500 errors, and retain mobile/desktop screenshots. Tables may scroll inside their own container.

`playwright-report` and `test-results` are git-ignored. Failure traces may contain fixture data, so keep retention short. The CI workflow uploads only these test artifacts, never environment files.

## Verification limits

A passing test suite does not substitute for reviewing screenshots, keyboard behavior, contrast or real business data reconciliation. Report actual pass/fail/skip counts from the final run. Blob upload verification requires a dedicated test Blob store; never upload fixtures into production storage.

