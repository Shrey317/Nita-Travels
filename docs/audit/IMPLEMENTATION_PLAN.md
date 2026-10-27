# Implementation plan — 28 October 2026

Status: proposed for approval after the pre-edit audit. This is not a completion report. Application changes have not begun. Findings refer to `AUDIT_REPORT.md`; inventory and routes are in `PROJECT_INVENTORY.md`.

## Scope and sequence

Use small reviewable batches on the existing architecture. Do not change old migrations, finance definitions, authentication contracts or historical data automatically. Complete remaining detailed source review within each affected area before editing it. No production data/credentials in verification; no schema drops, truncate, reset, bulk deletion or forced database synchronization.

### 1. Make verification safe (F23–25)

- Files: `scripts/safe-exec.ts`, `lib/test-environment.ts`, `lib/db/safety.ts`, `vitest.setup.ts`, Vitest/Playwright configs, fixture/test setup, CI, `docs/testing.md`.
- Use a dedicated local/test PostgreSQL target, synthetic credentials generated in memory, and an allowlisted child environment. Explicitly set both auth-origin aliases to loopback. Exclude application `.env*` files from an isolated source/build copy.
- Allocate fresh namespaces per suite/run instead of deleting prior fixtures. Retain namespaces for inspection; do not issue cleanup SQL. If no isolated database runtime is available, report that blocker without using the application database.
- Audit every test's direct deletion: replace cleanup deletes with unique fixtures and namespace isolation. Explicit workflow deletion tests must be considered against the user's restriction; default to transaction rollback/soft-delete assertions and defer hard-delete browser cases unless specifically authorized.
- Database impact: creates synthetic schemas/tables/rows only in the designated test target. No production migration. Risk: medium, because whole-fleet assertions depend on isolation.
- Verification: unit environment-guard tests; demonstrate production-like origins/variables cannot leak into child processes; confirm test targets and absence of destructive cleanup commands without logging URLs/secrets.
- Rollback: revert runner/config changes; retain synthetic schemas until an explicitly authorized cleanup procedure exists.

### 2. Resolve dependencies and mileage integrity (F01–02)

- Files: package manifests/lockfile, `lib/mileage-chain.ts`, targeted DB helper changes if necessary, mileage unit/integration tests.
- Apply compatible Next.js/ESLint patch. Update other affected dependencies deliberately; evaluate Zod/Blob compatibility before any major change. Do not force npm fixes.
- Enforce full-chain strict mileage progression and reject invalid baseline/edited readings atomically. Preserve valid gaps after intermediate deletion and deterministic same-day ordering.
- Database impact: none; no migration or retrospective recalculation.
- Verification: all unit tests, exact reproductions of both baseline failures, valid chains/gaps, integration rollback preserving original rows and vehicle mileage, auth/actions/assets/upload regressions, dependency audit and build.
- Rollback: revert the application patch; never undo historical records to match a previous code version. Do not deliberately redeploy vulnerable dependencies without a documented incident decision.
- User-visible benefit: invalid mileage corrections receive actionable errors instead of altering derived distances. Risk: medium. Depends on batch 1 for integration checks.

### 3. Repair confirmed workflow and reporting defects (F07–14, F17–18, F22)

- Files: dashboard components/page, transaction form, date-default consumers, mileage table/alerts, repairs page/query scope, shared list-query parser and server pages, pagination/notes ordering.
- Fix transaction destinations; make fleet slices disjoint; reuse shared service status; remove synthetic sparklines; use truthful “not recorded” wording and section labels.
- Apply business-day defaults without changing historical dates. Make transaction category transitions explicit and keep validation errors visible. Reuse one query parser for both API and pages, with clear invalid-filter feedback.
- Distinguish per-reading mileage from complete-week totals, keeping the existing aggregation engine. Label or synchronize repair summaries with selection.
- Database impact: none. No migration. No historical writes.
- Verification: synthetic category-switch flow, midnight boundary, link destinations, empty/negative/large totals, weekly reconciliation, invalid/fractional page/date input, stable same-day pagination, inactive/sentinel records and browser Back/Forward.
- Rollback: revert affected components/helpers. User-visible benefit: functioning drill-down, honest metrics and fewer blocked forms. Risk: low–medium. Depends on batch 2 baseline correctness.

### 4. Security hardening with compatibility (F03–04, F06)

- Files: upload route/helpers/schemas/UI and tests; shared API/Prisma logging; transaction update helper and concurrency tests.
- Replace raw error logging with allowlisted diagnostics. Resolve concurrent update loss using transaction locking or version conflicts, preserving the current mutation contract where possible.
- Define new-upload intent/completion verification and application-store ownership. Accept existing unchanged attachment references through a deliberate legacy-compatible path, not a global validation bypass. Verify real object metadata on the trusted server path; do not fetch arbitrary user hosts.
- Database impact: logging/concurrency may need none. Persistent upload intent may need one additive model/index migration; present its concrete schema and retention implications before applying it. No automatic attachment migration/deletion.
- Verification: forged/unsigned/wrong-store/uncompleted uploads, metadata mismatch, size/count/order/pending states, expired intents, existing attachments on unrelated edits, race tests and redacted errors. Provider callback integration uses a dedicated test store only if available.
- Rollback: keep additive tables; revert code to compatible reader behaviour. Risk: medium–high. Depends on safe fixtures and dependency compatibility. Public-to-private Blob conversion is outside this initial batch pending the decision.

### 5. Themes, accessibility and responsive rendering (F15–16, F19)

- Files: global tokens/root layout/Tailwind, affected semantic-color consumers, shared dialogs/charts, dashboard components, E2E/a11y tests.
- Implement real light/dark palettes; replace hardcoded foreground/surface colors where they prevent theming. Preserve the intentional login/hero artwork.
- Correct normal-text contrast, focus indicators, status labels, dialog containment/descriptions, page headings and accessible chart equivalents. Make metric containers adapt to available card width; provide definite chart heights and truthful empty states.
- Database impact/migrations: none. Risk: medium visual regression risk.
- Verification: actual computed colors and palette contrast, keyboard and focus-return flows, automated scan plus manual inspection, loaded images, nonzero chart geometry, long text/amount clipping, console/hydration errors and both themes.
- Rollback: revert style/component batch together. User-visible benefit: usable light theme and readable mobile/desktop layouts.

### 6. Measured performance and data consistency (F05, F20–21)

- Files: affected `lib/db/*`, analytics aggregation hot paths, narrow client DTOs, performance fixtures. Prisma indexes only with measured justification.
- First measure query counts, result sizes, rendering/bundle size and representative synthetic small/large fleet timings. Move timeline pagination into the database with deterministic order; avoid duplicate reads and repeated array copying. Preserve complete exports through batching/streaming.
- Odometer provenance is a separate sub-batch requiring the decision in the audit. Preserve existing manual maxima in the meantime; never infer and overwrite a historical reading.
- Database impact: possible additive composite indexes and, only if approved, provenance fields. No destructive migration or guessed backfill.
- Verification: query plans on synthetic data, exact cent/row reconciliation against the prior engine, filtered/all-history pagination, zero/missing/negative values, stable exports, stale-cache invalidation and preservation fixtures.
- Rollback: revert query code; additive indexes/fields can remain. Risk: medium; high for an unreviewed odometer policy. Depends on all earlier correctness batches.

### 7. Release verification and final report

- Run formatter check if introduced, typecheck, lint, all applicable unit/integration tests, fresh dependency audit, clean isolated production build, browser suites and migration preservation.
- Migration preservation fixture: create synthetic legacy-shaped records against the appropriate earlier migration state, apply later migrations once, then compare IDs, row counts, exact cents, SQL dates, inactive status, nullable references, `ALLCR`, attachment order and soft-deleted records. Do not use production exports, resets or cleanup deletes.
- Update stale E2E expectations to the current approved UI; keep meaningful assertions for each workflow. Do not replace failures with skips merely to pass.
- Save reviewable synthetic screenshots and measurements. Inspect login, dashboard, vehicles, profile, transactions/form, mileage, repairs, service, notes, weekly, monthly, analytics, alerts, reports, replacement and data quality, plus every changed screen.
- Required widths: **375, 480, 768, 1024, 1280, 1440, 1920 px**, in light and dark where supported. Verify real chart rendering, broken images, clipped content within containers, keyboard navigation and no console/hydration errors. Existing 320px checks may remain as extra coverage.
- Record exact passed/failed/skipped counts separately from not-run checks. Final report must enumerate actual files changed, schema impact, remaining limitations and production-only checks. No completion declaration while required gates remain unverified.

## Release and rollback procedure

1. Verify final diff and tests; keep credentials exclusively in the deployment secret store. Required existing configuration includes database/direct-connection variables, Auth.js secret/origin, administrator identity/password hash and Blob token. Any new upload-store identifier must be documented by name, never value.
2. Before an approved schema migration, obtain a verified backup through the existing operational process and rehearse restore only into a new isolated destination. Do not run destructive restore against the live database.
3. Apply reviewed additive migrations once, deploy a preview with separate test services, then perform authenticated smoke and callback tests there.
4. Deploy only after the recorded gates pass and the intended target is explicit. Check production login/logout, redirects, protected APIs, critical read workflows, response headers, provider callbacks, errors and readiness without test seeding.
5. Roll back application code to a compatible release if necessary; leave additive schema changes in place. Never reverse a migration by deleting history. Do not label production verification complete until actually performed.

## Proposed approval scope

Approve batches 1–5 and the measurement/DTO/pagination portions of batch 6, followed by batch 7. Preserve current odometers and legacy public attachments until the two policy decisions are resolved. Concrete additive schema changes will be reviewed before application; no production deployment, destructive cleanup or automatic history repair is included in this approval.
