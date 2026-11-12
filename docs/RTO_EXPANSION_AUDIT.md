# Fleet expansion audit — 11 November 2026

## Existing implementation

Next.js 15 App Router, React 19, strict TypeScript, Tailwind/Radix, Prisma 5/PostgreSQL, NextAuth credentials and Vercel are already in use. Dashboard, vehicle profiles, transactions, mileage, maintenance, weekly/monthly analytics and CSV exports read the existing database. Administrators and approved managers have database-revalidated sessions. Changes by managers use ChangeRequest approval. Unit, isolated PostgreSQL integration and Playwright suites exist; deployment runs a release check and build.

Preserve Transaction, MileageEntry, VehicleNote, WorkOrder and FleetDocument data and their reporting semantics. Vehicle is the permanent identity. Existing integer-cent columns must not be converted. New ledgers use Decimal(14,2), with decimal arithmetic and string API values. Shared navigation, layouts, error mapping, session checks, CSV escaping and UI primitives can be reused.

## Integration findings

- No driver, RTO agreement, allocation ledger, operational assignment or verified bank ledger exists.
- Vehicle finance fields are estimates used by existing reports; they are not evidence of bank principal repayment. Do not import these as verified balances.
- Existing uploads are public Blob objects. Confidential contracts/bank evidence need authenticated delivery; public upload URLs must not be reused for these documents.
- Mileage recalculation only considers normal-rental sources. Transfers require a shared odometer floor and separate business histories.
- Existing normal-rental finance includes ALLCR/null sentinel references. Preserve those; use real foreign keys for new models.
- Existing runtime Vehicle DDL is technical debt. New schema must be migration-owned, never created by requests.
- Authentication currently has ADMIN/MANAGER, no finance role. Restrict bank finance to ADMIN initially.

## Migration and implementation approach

Add assignment, handover/transfer and audit history; add dedicated RTO and bank tables with restrictive foreign keys. Preserve all existing financial rows. Backfill one rental assignment per existing vehicle using its purchase date; do not fabricate payments, drivers, bank balances or contracts. Serialize transfers and activation with vehicle row locks; add a database unique index on open assignments. Resolve an agreement before transfer. Keep new ledgers out of existing reports by construction.

Implement domain calculations and validated transactional mutations, then authenticated pages/forms, private document delivery, exports and focused regression checks. Production migration is a distinct release operation: take a verified backup, apply additive migration on staging, run preservation/concurrency tests, then deploy migration before application. Roll back application code without dropping the new tables or erasing new records. Destructive down migrations are deliberately not supplied.

## Verification limits

Repository review establishes intended paths, not proof that deployed data or external services are healthy. No production database inspection or mutation is part of this audit. Deployment, legal approval of contract terms, and production reconciliation remain separate operational checks.
