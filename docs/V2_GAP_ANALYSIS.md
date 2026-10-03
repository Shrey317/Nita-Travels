# Production transformation audit — 2 October 2026

Audit completed before implementation. Coverage: route tree, pages/components/forms/charts,
Prisma schema and all four migrations, lib calculations/queries/actions, auth and API routes,
configuration, public assets, scripts, tests/E2E, README and existing audit documents.

## Architecture and disposition

| Area | Existing foundation | Disposition and verified gap |
|---|---|---|
| Runtime | Next 14 App Router, strict TypeScript, Prisma 5/Postgres | DO NOT TOUCH framework architecture; preserve current APIs and workflows |
| Finance | Integer cents; shared margin, ROI and per-km functions | REFACTOR aggregation into existing analytics boundary; dashboard fabricates 100% from zero baseline and mixes period profit with lifetime distance |
| Dashboard | Fleet totals, priorities, service summary, insurance, insights | IMPROVE with consistent period metrics, shared alerts, clickable fleet status; remove duplicate priority derivation |
| Analytics | Lifetime category/ranking tables and charts | IMPROVE existing engine with date/vehicle/comparison filters, transparent profit bridge, maintenance/mileage evidence and multi-vehicle comparison |
| Vehicle | CRUD, financials, health, replacement card, chronological timeline | DO NOT TOUCH tested health weights/timeline; IMPROVE explicit deductions and evidence; FIX deactivation hiding history and edit reactivation |
| Weekly/monthly | ISO weeks with 52-week default; calendar-month buckets | IMPROVE custom filtering, exact source date bounds, mileage and maintenance; weekly currently widens custom/year bounds |
| Alerts | Computed notification center, insurance/service rules | REFACTOR reuse for dashboard and NEW central alert view; group stable identities; no fabricated mechanical claims |
| Intelligence | Repair frequency and high cost checks | NEW repeat-category evidence, mileage anomaly baseline, data-quality view, reports built on shared existing analytics |
| Documents | Vercel Blob attachments on transactions, mileage and notes | IMPROVE trust/extension/count checks; preserve existing storage. Vehicle document registry requires a real metadata workflow |
| Data model | Vehicle, Transaction, MileageEntry, VehicleNote, RateLimit | DO NOT TOUCH integer cents and ALLCR/null semantics; warranty is text; no downtime intervals or actual finance/insurance-payment categories |
| Data integrity | Zod and partial-update merge; mileage chain | FIX missing transaction/note vehicle reference validation, chronological mileage progression and Prisma Int limits |
| Deletion | Transactions soft-delete; notes/mileage hard-delete; vehicle deactivation | PRESERVE established record strategies; deactivation must preserve historical vehicle access |
| Search/navigation | cmdk, responsive grouped sidebar, server search | FIX opaque-ID filtering/stale responses, accessible names, badge mappings; add only implemented routes |
| Design | Inter, navy/teal, tokens, Radix primitives, shared table/loading/error states | IMPROVE contrast, rhythm, chart colors/tooltips, responsive controls; REMOVE invalid chart token references and unnecessary motion |
| Auth/security | NextAuth JWT + middleware + session checks, DB rate limits | PRESERVE auth; FIX test bypass guard, credential debug logs, CSV injection and weak query input handling |
| Performance | Server aggregation, batched financial/service reads | IMPROVE projection and bounded shared reads; avoid N+1 and avoid cache without invalidation |
| Tests | Pure Vitest tests, DB integration tests, five E2E smoke workflows | REFACTOR safe test separation; default glob currently includes destructive tests; NEW isolated fixtures, reconciliation/date/intelligence and browser workflows |
| Deployment/docs | Vercel/Neon/Blob configuration | IMPROVE accurate setup/test docs and CI; REMOVE obsolete counts and nonexistent seed instructions |

## Invariants

- Ledger totals include ALLCR, unassigned and inactive-vehicle history; deleted transactions are excluded.
- Vehicle comparisons explain fleet overhead instead of silently distributing it.
- Money is summed as integer cents; ratios remain derived values and round only for presentation.
- Missing or zero distance produces unavailable per-km metrics, never invented mileage.
- Undefined percentage change from a zero denominator is shown as unavailable.
- Date-only records use UTC calendar dates; the current business date comes from Africa/Johannesburg.
- Warranty expiry, actual downtime, GPS utilization and undocumented finance/insurance costs are never inferred.
- Production mutation tests are prohibited; database identity must be verified before fixtures or cleanup.

## Implementation sequence

1. Repair integrity/test safety and centralize period/metric definitions.
2. Extend existing analytics queries and reuse them across dashboard, intelligence and exports.
3. Improve navigation, vehicle command center and common visual/accessibility boundaries.
4. Reconcile source totals and run typecheck, lint, unit/integration tests, build and isolated browser QA.
5. Record observed results and remaining limitations without claiming unverified acceptance.
