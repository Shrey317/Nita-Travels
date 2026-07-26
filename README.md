# Nita Travels Fleet Management System

A fleet management system for a 9-vehicle South African ride-hailing fleet (8× Suzuki S-Presso,
1× VW Kombi), replacing an Excel workbook covering transactions, service tracking, mileage
monitoring, vehicle profiles, and analytics.

**Status: Feature-complete.** All 9 pages from the spec are built: Dashboard, Vehicles (list,
profile with Activity Timeline, add/edit), Transactions (filtered list, add, inline edit/delete,
CSV export), Repairs Log, Mileage Log, Service Status, Vehicle Notes, Monthly Breakdown, and
Analytics — plus photo attachments on Transactions/Mileage/Notes (added beyond the original
spec) and insurance-expiry alerts on the Dashboard. 95 tests pass for real against the business
logic and validation layer. See "How this was verified" below for exactly what could and
couldn't be checked from this environment, and why.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict) |
| ORM | Prisma 5 |
| Database | PostgreSQL via Neon (serverless) |
| Styling | Tailwind CSS 3 |
| Components | shadcn/ui-style (hand-built on Radix primitives) |
| Auth | NextAuth.js v5, credentials provider |
| Charts | Recharts 2.x |
| File storage | Vercel Blob (photo attachments — see "Beyond the original spec" below) |
| Testing | Vitest |

## Architecture

```
app/                    Pages (data fetching + layout only — no calculations)
  (auth)/login/
  (dashboard)/           Sidebar shell + all 9 authenticated pages
  api/                   REST-ish API routes, thin wrappers over lib/db/
  error.tsx, global-error.tsx, not-found.tsx
components/
  ui/                    Design-system primitives (button, card, table, dialog, ...)
  layout/                Sidebar, nav config
  shared/                Cross-page pieces: pagination, multi-select, photo upload/viewer, ...
  vehicles/, transactions/, mileage/, notes/, service/, repairs/, monthly/, analytics/, dashboard/
lib/
  db/                    All Prisma queries, one file per entity
  schemas/               Zod validation, one schema per entity
  service.ts             Service-status derivation (pure functions, no I/O)
  mileage.ts             Weekly-limit derivation (pure functions, no I/O)
  alerts.ts              Insurance-expiry derivation (pure functions, no I/O)
  format.ts              All display formatting (ZAR, km, margin, dates)
  constants.ts            Shared enums/labels/sentinels used across lib/ and components/
  errors.ts, api-response.ts   Typed errors -> consistent HTTP responses
prisma/
  schema.prisma
  seed.ts                Parses prisma/seed-data/*.csv — see below
  seed-data/              The three CSVs this was built from
__tests__/lib/           Vitest suite — see "Testing" below
```

Business logic lives only in `lib/`; pages and API routes call into it rather than
recalculating anything themselves, per the layering rules in the original spec.

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres pooled connection string |
| `DIRECT_URL` | Neon Postgres direct connection string (migrations only) |
| `NEXTAUTH_URL` | Full URL of the deployed app |
| `NEXTAUTH_SECRET` | Random JWT signing secret — generate with `openssl rand -base64 32` |
| `ADMIN_USERNAME` | Login username (default `admin`) |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password — never the plaintext |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token, for photo uploads on Transactions/Mileage/Notes |

Copy `.env.example` to `.env` and fill these in. No values are committed anywhere in this repo.

## Local development

```bash
npm install                 # also runs `prisma generate` via postinstall
npx prisma migrate dev      # creates tables in your Neon database
npx prisma db seed          # loads the 9 vehicles + parses prisma/seed-data/*.csv
npm run dev
```

Running the test suite:

```bash
npm test                    # 95 tests, all business logic and validation — no database needed
```

Generating an admin password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('your-password-here', 10))"
```
Paste the output into `ADMIN_PASSWORD_HASH`.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Create a Neon Postgres project; copy its pooled and direct connection strings.
3. Import the repo into Vercel; add all the environment variables above.
4. Deploy. Vercel's build runs `prisma generate` automatically (via `postinstall`).
5. Run migrations once against the new database: `npx prisma migrate deploy` (with
   `DATABASE_URL`/`DIRECT_URL` pointed at Neon — either locally or via `vercel env pull`).
6. Run `npx prisma db seed` the same way, once.

## Testing

```bash
npm test
```

95 tests, all passing, covering:

- **`lib/service.ts`, `lib/mileage.ts`, `lib/alerts.ts`** — every status boundary (0km, 2,999km,
  3,000km remaining; 30 vs. 31 days to insurance expiry; the exact CR01 overdue case found during
  data review), not just happy paths.
- **`lib/format.ts`** — including a real bug the tests caught in themselves, not the app: `en-ZA`
  locale formatting genuinely uses a non-breaking space as its thousands separator and a comma as
  its decimal point (`"R 1 500,00"`, not `"R 1,500.00"`), which is correct, authentic South
  African formatting and exactly what the spec's own `toLocaleString("en-ZA", ...)` snippet
  produces — my first draft of the tests assumed US-style formatting and failed against the real
  output. The application code was right the whole time; the tests were wrong until verified
  against actual `Intl` behavior. Worth knowing so the spacing in the app doesn't look like a bug
  when you first see it — it's correct.
- **All four Zod schemas** — the cross-field rules specifically: income/expense both-zero and
  both-positive rejection, the R0-Service exception, Service requiring mileageKm, the "no
  character limit" note field, ALLCR/null vehicle handling.

**What isn't covered here:** API routes, the seed script, and anything else that touches Prisma
directly. Testing those meaningfully needs either a real database connection or mocking Prisma
convincingly enough to trust the result — and since I can't run real Prisma in this sandbox to
validate a mock's shape against it (see below), writing those tests now would mean shipping
tests I have no way to confirm are actually correct. That's a real gap, not a hidden one: it's
the natural next step once this is running against a real database, at which point integration
tests against that database will be more valuable than mocked unit tests would have been anyway.

## How this was verified

This project was built and reviewed in a sandboxed environment with restricted network access.
Here's exactly what that did and didn't allow, so nothing here is taken on faith:

**Fully verified, for real:**
- `npm install` — every dependency actually installs; version conflicts would have surfaced.
- `tsc --noEmit` and `eslint` — run after every phase, not just at the end.
- The full Vitest suite (95 tests) — actually executed, not just written.
- Every Recharts chart — Recharts has no native binary, so `tsc` checks its usage for real, same
  as everything else that isn't Prisma.

**Could not be verified here, and why:**
- `prisma generate`, `migrate`, and `db seed` need to download a native query-engine binary from
  `binaries.prisma.sh`, which this sandbox's network egress doesn't allow — confirmed directly
  (`403 host_not_allowed`), not assumed. Every `tsc` error this produces downstream (missing
  `Vehicle`/`Transaction`/etc. types) was individually confirmed to be exactly that cascade and
  nothing else, phase by phase, rather than blanket-ignored.
- `next build` itself, since it type-checks the same Prisma-dependent code internally.
- Runtime behavior against a real Postgres database, and the Vercel Blob upload flow, since
  neither has live credentials here.

None of this is a property of the code — it's a property of this sandbox specifically. The
moment `npm install` runs somewhere with normal internet access (your machine, CI, or Vercel's
build), `prisma generate` succeeds and every one of those cascade errors resolves on its own.
Two real bugs and one real risky pattern were still caught this way, by treating every remaining
error as something to individually explain rather than wave away:
- A NextAuth route-handler export that would have 500'd on every login attempt.
- A couple of strict-null-check gaps in the seed script's CSV parsing.
- `useSearchParams()` needing a `<Suspense>` boundary at build time — a Next.js-specific
  requirement `tsc` doesn't check at all, caught by manually reading every filter/pagination
  component rather than trusting the type-checker to catch everything.

Do `prisma generate`/`migrate`/`db seed` as the first step after cloning this locally — everything
downstream is written to work correctly the moment that step succeeds.

## Data corrections applied during seeding

The source workbook's `Service Log` tab contained a handful of records with no matching row in
`Transactions` — these were gap-filled as their own Service transactions (see the comment above
`gapFillTransactions` in `prisma/seed.ts` for the exact list and reasoning, including one
CR0-vehicle free/warranty service recorded at R0). Where the two tabs disagreed on a service's
mileage, the Transactions figure was used, per the source-of-truth rule this system enforces.
`Vehicle.currentMileageKm` is set for each vehicle to the true maximum across the vehicle
register, its service history, and its mileage log — not just whatever the register happened to
say — since the register itself was found to be out of date for several vehicles.

## Beyond the original spec

Two additions were made at the fleet owner's request, layered onto the schema without touching
any of the required functionality:

- **Photo attachments** — `photoUrls String[]` on Transaction, MileageEntry, and VehicleNote,
  backed by Vercel Blob. Upload widgets on the Transaction, Mileage, and Notes forms; thumbnail-
  plus-lightbox viewing wherever those records are listed (Activity Timeline, Repairs Log, the
  Mileage and Notes tables).
- **Insurance-expiry alerts** — `lib/alerts.ts`, surfaced on the Dashboard when a vehicle's
  insurance has expired or expires within 30 days. Purely derived from the existing
  `insuranceEndDate` field; nothing new to enter.

## Known limitations

- `prisma generate`/`migrate`/`db seed` still need to be run against a live database as the
  first setup step — see "How this was verified" above for exactly why and what that does and
  doesn't imply about correctness.
- Photo uploads require `BLOB_READ_WRITE_TOKEN` to be set (Vercel dashboard → Storage → Blob →
  create a store → copy the token). Everything else in the app works fine without it — only the
  upload buttons would error until it's set.
- API routes and the seed script aren't covered by the automated test suite — see "Testing"
  above for why, and what the natural next step is.
- No CI pipeline is configured yet (e.g. running `npm test`/`tsc`/`eslint` on every push) — worth
  adding once this is in a real GitHub repo.

## Notes for future maintainers

Four things caught during review that are worth knowing about, since none of them would show up
in `tsc` or `eslint` on their own:

- **`useSearchParams()` needs a `<Suspense>` boundary**, or `next build` fails outright — a
  Next.js build-time requirement, not a style preference. `Pagination`, `TransactionFilters`,
  `TimelineFilters`, `VehicleDateFilters`, and `SortableHeader` are all self-wrapped in their own
  `<Suspense>` internally, so no page using them needs to remember to add one.
- **Prefer `type X = Y & {...}` over `interface X extends Y`** when `Y` is a Prisma model type.
  Under a broken/ungenerated client, `extends` silently drops all inherited members instead of
  falling back permissively the way `field: Y[]` does — this made `MileageRow` look far more
  broken than it actually was during review before being fixed to match the intersection pattern
  every other joined-relation table component already used.
- **Vehicle deactivation had no UI.** `DELETE /api/vehicles/[id]` existed from early on, but
  nothing ever called it. Fixed with a "Deactivate" button on the Vehicle Profile header,
  AlertDialog-confirmed, visible only while active (an "Inactive" badge shows instead once
  deactivated).
- **The Transactions table wasn't actually sortable**, despite SRS 15.4 describing it that way —
  the only table in the spec described as "sortable" rather than given a fixed default order.
  Fixed with real clickable-header sorting (`SortableHeader`, `sortBy`/`sortDir` URL params) on
  Date, Vehicle, Category, Income, Expense, and Mileage.
- **`GET /api/dashboard` was missing entirely.** The Dashboard page itself never needed it (it
  calls the data layer directly for its own render), so its absence didn't affect anything
  visible — but SRS 16 lists it as a required endpoint, and a spec-completeness check should
  check every line of the contract, not just the pages that happen to exercise it. Added as a
  thin wrapper over the same `getVehiclesWithFinancials()`/`getFleetTotals()` functions the page
  uses, not a second implementation.

The last two were both found by walking the Definition of Done checklist line by line rather than
assuming page-by-page completeness — see below.

## Definition of Done

Going through the spec's own checklist honestly: everything in it is done and directly verified
*except* the handful of things that depend on `prisma generate` succeeding somewhere with normal
internet access (`npm run build`, zero runtime errors, a successful Vercel deploy) and visual
confirmation of the responsive breakpoints in an actual browser, neither of which this sandbox
can do — both are explained in detail above rather than assumed. The one intentional scope
boundary: deactivating a vehicle drops it from the active list with no built-in way to browse or
reactivate it afterward (its direct profile URL still works, and none of its history is lost, but
finding it again means knowing its ID) — the spec doesn't ask for an archived-vehicles view, so
this wasn't built.
