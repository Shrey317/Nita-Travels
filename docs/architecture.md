# Architecture after the production transformation

The application uses Next.js 15 App Router, strict TypeScript, React 19, Prisma 5 and PostgreSQL.
It uses the existing design tokens, Radix components, credential-based single-admin authentication,
SWR notification refresh and Vercel Blob attachment storage. No parallel storage/analytics service,
new database model or migration is introduced by the interface modernization. Route parameters and
search parameters use the framework's asynchronous request API.

## Project boundaries

- `app`: route composition, authentication boundaries and HTTP validation.
- `components/<feature>`: feature presentation; `components/ui` and `components/shared`: reusable primitives.
- `lib`: pure business rules; `lib/db`: persistence; `lib/schemas`: validation; `lib/hooks`: browser subscriptions.
- `scripts/database`: explicit operational backup/restore; remaining scripts: isolated test setup and fixtures.
- `__tests__/lib`, `__tests__/integration`, `e2e`: pure, database and browser verification respectively.
- `docs/history`: historical audits. `.local-archive` and `.local-import` are ignored local recovery material, never application inputs.

The dashboard uses native disclosure sections for optional detail. Mobile ledger and fleet views
provide cards, with tables retained on desktop. Analytics filters navigate through the router and
reset draft controls when browser history changes. A shared SWR hook deduplicates notification reads;
dashboard service queries are shared with the notification calculation within the same request.

## Read paths

Authenticated pages call `lib/db` directly. API routes additionally call `requireSession` and map
validation failures through `handleApiError`. `getAnalyticsReport` is the period-report boundary:
shared date selection → three parallel source queries → pure period summary → UI and CSV exports.
Full history adds two date-bound aggregate queries. Financial totals retain integer-cent arithmetic.
Source transactions and odometer records are not serialized into client charts; bounded summary
rows and vehicle options are passed instead. Server analytics are dynamic; there is no long-lived
cache that can survive a mutation.

Weekly/monthly reads use `getPeriodBreakdown` and `aggregatePeriods`. Replacement review composes
existing vehicle financial summaries and maintenance projections with existing review thresholds.
Current operational notifications share one implementation across priorities, navigation badges
and the alert center. The alert center adds deterministic financial/repair/data findings.

## Mutation paths

Forms → authenticated route → Zod schema → domain mutation → `invalidateFleetData` → refreshed
server pages and a client `fleet-data-changed` event for SWR consumers. Partial updates are merged
and revalidated. Transaction/note vehicle references are checked against real database rows while
preserving ALLCR and null semantics. Mileage writes lock the vehicle row in a transaction, validate
its complete chronological chain, recalculate neighbors, and return the persisted derived reading.

Transaction deletion is soft. Vehicle deactivation now changes active state without hiding the
profile/history. Existing notes and mileage deletion semantics are preserved. The test runner never
changes production/development `.env` files; each integration/E2E run creates, migrates and removes a
fresh schema on a separately verified PostgreSQL database.

## Routes

- Overview: `/` dashboard and `/alerts`.
- Fleet/operations: `/vehicles`, vehicle profiles/add/edit, `/mileage`, `/service`, `/repairs`, `/notes`.
- Finance: `/transactions`, `/weekly`, `/monthly`.
- Intelligence: `/analytics`, `/reports`, `/data-quality`, `/replacement`.
- Auth: `/login`; private API endpoints mirror existing CRUD plus `/api/reports/export`.

Shared loading/error boundaries cover all new routes. No Settings or driver/GPS/accounting modules
are added. The command palette uses the same navigation registry and bounded, authenticated search
across vehicles/insurance/warranty text, transactions, service/repair records, mileage and notes.

## Security and deployment boundaries

Test authentication requires a dedicated application flag, APP_ENV=test and an approved isolated
schema; Playwright's own environment flags cannot enable it. Production mode rejects it. Credentials
are never sent to client components. CSV text is formula-neutralized. Upload tokens require admin
sessions, permitted extension/MIME and byte size. Blob completion callbacks reach the SDK for HMAC
verification; possessing a signature header alone never grants upload-token access.

Blob URLs are existing public storage URLs; this pass does not convert the store to private storage
or add a document registry/retention policy. Production upload delivery needs a configured store and
preview smoke verification. See deployment and testing documentation for explicit operating steps.
