# Nita Travels Fleet Intelligence

A Next.js application for fleet finance, maintenance, mileage and operational decisions. All production dashboards read recorded PostgreSQL data. Test fixtures are synthetic and are loaded only into isolated test schemas.

## Architecture

- `app/(dashboard)` contains authenticated pages; `app/api` provides validated HTTP endpoints.
- `lib/db` owns Prisma queries and mutations; `lib` owns financial, date, health, mileage and intelligence calculations.
- `components` contains the shared design system, accessible forms, filters, tables and charts.
- PostgreSQL stores financial amounts as integer cents. Vehicle deactivation preserves access to its history. Transaction deletion is soft deletion and excludes that transaction from active totals.
- NextAuth credentials authentication protects pages, APIs and server actions. Vercel Blob stores validated image and PDF attachments.

See the [transformation report](docs/PRODUCTION_TRANSFORMATION_REPORT.md), [V2 gap analysis](docs/V2_GAP_ANALYSIS.md), [architecture](docs/architecture.md), [financial definitions](docs/financial_metrics.md), [testing](docs/testing.md), and [deployment](docs/deployment.md).

## Development

Use Node.js 22, install with `npm ci`, copy `.env.example` to `.env`, and supply development database and authentication settings. Generate the Prisma client with `npm run prisma:generate`, deploy committed migrations with `npm run prisma:deploy`, and start `npm run dev`.

Never run `scripts/seed_custom.ts` against a business database: it is a legacy destructive import, not the development or test setup command. Do not run production migrations against a local fixture cluster or point tests at production credentials.

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

The CI workflow runs typecheck, lint, unit tests, integration tests, build and Chromium E2E with an ephemeral PostgreSQL service. Test counts come from the actual run output, rather than an outdated count in this README.

## Product boundaries

Operational conclusions are evidence based. Downtime is unavailable where no start/end records exist. Free-text warranty information cannot establish an expiry date or remaining distance. Finance projections and TCO cost inclusion must be interpreted according to the financial definitions; the platform does not infer unrecorded costs or make replacement decisions on management's behalf.
