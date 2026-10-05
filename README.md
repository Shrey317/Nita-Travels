# Nita Travels Fleet Intelligence

A Next.js 15 / React 19 application for fleet finance, maintenance, mileage and operational decisions. All production dashboards read recorded PostgreSQL data. Test fixtures are synthetic and are loaded only into isolated test schemas.

## Architecture

- `app/(dashboard)` contains authenticated pages; `app/api` provides validated HTTP endpoints.
- `lib/db` owns Prisma queries and mutations; `lib` owns financial, date, health, mileage and intelligence calculations.
- `components` contains the shared design system, accessible forms, filters, tables and charts.
- `lib/hooks` contains shared browser data subscriptions; navigation and notifications use the same SWR request.
- `__tests__/lib` contains pure and mocked tests; `__tests__/integration` contains database tests; `e2e` contains browser workflows.
- `scripts/database` contains explicit backup and restore tools; `scripts/safe-exec.ts` owns disposable test environments.
- `docs/history` retains earlier design audits. Generated reports, local archives and data backups are excluded from Git and deployment.
- PostgreSQL stores financial amounts as integer cents. Vehicle deactivation preserves access to its history. Transaction deletion is soft deletion and excludes that transaction from active totals.
- NextAuth credentials authentication protects pages, APIs and server actions. Vercel Blob stores validated image and PDF attachments.

See the current [modernization report](docs/MODERNIZATION_REPORT.md), earlier [transformation report](docs/PRODUCTION_TRANSFORMATION_REPORT.md), [architecture](docs/architecture.md), [financial definitions](docs/financial_metrics.md), [testing](docs/testing.md), and [deployment](docs/deployment.md).

## Development

Use Node.js 22, install with `npm ci`, copy `.env.example` to `.env`, and supply development database and authentication settings. Generate the Prisma client with `npm run prisma:generate`, deploy committed migrations with `npm run prisma:deploy`, and start `npm run dev`.

Obsolete seed/import and one-off repair scripts have been removed from the application tree. Local historical copies are retained in `.local-archive`; they are not setup commands. Do not run production migrations against a local fixture cluster or point tests at production credentials.

From the repository root, `bash scripts/database/backup.sh` writes a timestamped dump under ignored `backups/`. `bash scripts/database/restore.sh <backup.sql>` explicitly confirms a restore and applies it in one transaction, stopping on SQL errors. These commands require PostgreSQL client tools and the intended `DIRECT_URL`.

## Quality checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration
npm run test:e2e
```

`npm test` runs pure and mocked tests without a database. Integration and browser tests require explicitly configured disposable PostgreSQL access and `ALLOW_DESTRUCTIVE_TEST_DB=true`; the runner rejects known application database targets and creates a fresh schema per run. See [testing instructions](docs/testing.md).

The CI workflow runs a production dependency audit, typecheck, lint, unit tests, integration tests, build and production-server E2E with an ephemeral PostgreSQL service. Chromium runs the full suite; Firefox and WebKit cover critical workflows. Test counts come from the actual run output, rather than an outdated count in this README.

## Product boundaries

Operational conclusions are evidence based. Downtime is unavailable where no start/end records exist. Free-text warranty information cannot establish an expiry date or remaining distance. Finance projections and TCO cost inclusion must be interpreted according to the financial definitions; the platform does not infer unrecorded costs or make replacement decisions on management's behalf.
