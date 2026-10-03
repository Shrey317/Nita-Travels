# Nita Travels transformation report

Verification date: 3 October 2026. Scope: the existing application in this workspace. This report distinguishes local verification from deployment acceptance; no production data was changed and no deployment was made.

## Executive summary

The existing fleet application now has a shared period-based financial and operational reporting path, a redesigned dashboard, expanded analytics, an alert center, seven CSV reports, data-quality findings and replacement review. The work preserves the established framework, database schema, integer-cent accounting and operational workflows. An audit preceded implementation; see [gap analysis](V2_GAP_ANALYSIS.md).

Important correctness fixes include matching period financial amounts to period mileage, exact weekly date bounds, undefined zero-denominator ratios, honest comparisons with zero baselines, chronological mileage validation, retained history after vehicle deactivation and isolated database testing. Dashboard, analytics and exports reconcile against common source records.

## Existing features preserved

- Next.js App Router, React, strict TypeScript, Prisma/PostgreSQL, NextAuth credentials and Vercel Blob.
- Vehicle creation/editing, active status, profiles, health categories, replacement thresholds, financing/insurance fields and activity timelines.
- Transaction creation/editing/filtering/export and soft deletion; repair association; service status; mileage entry/edit/delete; notes and attachments.
- ALLCR and unassigned ledger semantics, inactive-vehicle history and exclusion of deleted transactions.
- Established health weights and service thresholds. Health is an operational indicator, not a mechanical certification.
- Weekly/monthly views, navigation, theme choice, keyboard search, notification access, loading and error boundaries.

## New features

- `/alerts`: prioritized operational, financial, mileage, repeat-repair and data-quality evidence, with source links and severity filtering.
- `/reports`: weekly, monthly, financial, vehicle performance, maintenance, mileage and insurance CSV exports.
- `/data-quality`: incomplete insurance/warranty fields, missing mileage, inconsistent readings, unavailable vehicle references, suspicious transaction amounts, service mileage omissions and transactions preceding purchase dates.
- `/replacement`: existing screening thresholds plus lifetime figures, recent/prior repair spending and transparent recorded ownership-cost components.
- Expanded analytics: period/vehicle/comparison controls, exact profit-change contributors, sortable vehicle performance, side-by-side comparisons, maintenance and mileage evidence, coverage and trends.

## Visual and interaction improvements

Shared surfaces, cards, dialog styling, typography, semantic colors and chart tooltips are consistent in light and dark themes. The dashboard groups fleet status, priorities, financial snapshot, performance, maintenance, trends and management evidence. Vehicle profiles expose financial, maintenance, operations and activity sections.

Navigation adds only implemented routes. Status cards and financial labels link to supporting records. Search handles registrations and related records, rejects stale results and retains keyboard selection. Menus/dialogs have accessible names and focus behavior. Mutations guard pending submissions, handle failures and refresh affected server/client views.

Browser review identified and fixed chart-tooltip overflow after resizing, the comparison fieldset's intrinsic minimum width, and cramped mobile table columns. Chart animations are disabled so resizing cannot temporarily misalign data with period labels. Wide tables scroll inside their containers; numeric values remain readable.

## Analytics and financial definitions

All ledger amounts remain integer ZAR cents. Presentation converts cents to rand; per-km values remain cents/km until formatted. See [full financial definitions](financial_metrics.md).

| Metric or capability | Definition and change |
|---|---|
| Revenue / expenses | Sum undeleted income/expense columns within the exact selection; retain overhead and inactive history |
| Net profit | Revenue minus expenses; shared calculation |
| Margin | Net profit / revenue; unavailable when revenue is zero |
| Period revenue, cost and profit/km | Corresponding selected-period cents / valid recorded distance in that same period; fixes mixed period/lifetime denominators |
| Lifetime vehicle metrics | Retain current odometer minus purchase odometer, explicitly labelled lifetime |
| ROI | Net profit / purchase price × 100; unavailable for zero purchase price; existing definition retained |
| Absolute / percentage change | Current minus prior; percentage divides by absolute prior, with no fabricated percentage from zero |
| Margin movement | Percentage-point movement plus relative change where defined |
| Profit explanation | Revenue change plus each prior expense minus current expense; contributions exactly reconcile to profit change |
| Repair costs | Repairs, BrakePads and Tyres categories |
| Service / maintenance | Service separately; maintenance includes repair categories, Service and Maintenance |
| Maintenance/km / average repair | Maintenance / valid recorded km; repair amount / recorded repair count |
| Fixed / variable / unclassified | Licensing is explicitly fixed; known operating categories variable; remaining expense is unclassified, never guessed from free text |
| Vehicle contribution | Revenue, expense, profit, margin, distance and per-km figures per real vehicle; overhead shown separately |
| Mileage totals / averages | Valid distances attributed to the later reading date; daily/weekly averages over selected calendar days |
| Weekly limits | Sum entries per vehicle per ISO week before applying 2,000 km; historical analytics exclude partial boundary weeks |
| Mileage anomalies | At least 50% deviation from four consecutive prior recorded weeks; missing logs are not zeroes |
| Repeat repairs | Same vehicle/category recorded at least twice, with dates, count, latest interval and cost; no inferred mechanical diagnosis |
| Activity coverage | Vehicles with recorded financial or mileage activity; explicitly not true utilization |
| Service estimate | Group recorded mileage within the previous eight complete weeks, rather than treating eight entries as eight weeks |
| Recorded ownership cost | Purchase price plus recorded operating expenses; partial cost view, with potential finance-principal overlap disclosed |

Presets include today/yesterday, this/last week/month, three/six/twelve months, YTD, current/previous year, full history and custom dates. Three months means exactly three calendar months. Date-only records use UTC calendar dates; today uses Africa/Johannesburg. Previous-period, previous-month, previous-year and normalized rolling comparisons are labelled explicitly. ISO week-year boundaries and leap days are tested. Full history can exceed ten years; arbitrary custom spans are bounded to ten years.

## Database and performance changes

Schema changes: none. New migrations: none. Index changes: none. All four existing migrations applied successfully to each disposable test schema.

Mileage mutations lock the relevant vehicle row, validate the chronological chain and recalculate affected readings within a transaction. Transaction/note references are checked while preserving ALLCR/null behavior. Deactivation changes active state and retains profile access.

Analytics uses parallel projected queries with selected/current/comparison bounds, plus a four-week mileage baseline. Full history adds date-bound aggregates. Weekly/monthly aggregation shares the financial functions. Vehicle and service reads remain batched rather than querying inside a vehicle loop. Server reports are dynamic; invalidation and client refresh events avoid stale figures after mutations. No new runtime dependency was added. Large-fleet load testing was not performed; this remains an in-process reporting design intended for the existing small fleet.

## Security changes

- Session checks on API paths and authenticated server search; unauthenticated mutations/exports tested.
- Removed authentication debug output; isolated test login requires explicit application and schema guards and cannot be enabled by Playwright's own flag.
- Tests reject configured application database identities, create unique disposable schemas and clean up only those schemas. No environment file replacement or production resets.
- Strict calendar dates, ordered query bounds, Prisma integer limits, merged partial-update validation and real vehicle-reference checks.
- CSV formula neutralization for text while retaining genuine numeric negatives.
- Attachment URL/count checks; supported extension/MIME/size validation; upload tokens require a session. Blob completion signatures are validated by the SDK.
- Friendly JSON/validation/not-found/conflict responses instead of exposing database failures to the client.

Existing public Blob URLs remain public. This pass does not claim private-document storage, content malware scanning or a penetration-test certification.

## Accessibility

Accessible control names, keyboard search, labelled filters and comparison controls, semantic tables, focus/escape behavior from Radix, skip navigation, chart text/table alternatives and non-color status descriptions were reviewed. Both themes and six viewport widths are covered by browser assertions. This is practical keyboard/responsive verification, not a formal screen-reader or WCAG conformance audit.

## Testing

| Check | Passed | Failed | Skipped | Status |
|---|---:|---:|---:|---|
| Unit / mocked tests | 191 | 0 | 0 | PASS |
| PostgreSQL integration | 11 | 0 | 0 | PASS |
| Chromium E2E main suite | 44 | 0 | 0 | PASS |
| Final mutation / chart checks | 10 | 0 | 0 | PASS |
| TypeScript | — | — | — | PASS |
| ESLint | — | — | — | PASS |
| Production build | — | — | — | PASS |

The browser results comprise 46 distinct scenarios: 44 in the main run, followed by two additional mutation scenarios and eight chart-route rechecks. Both final runs completed without failures or skipped tests. The full-suite HTML report is retained in `test-results/full-suite-report/index.html`; the focused report is in `test-results/focused-suite-report/index.html` (ignored local artifacts). Database cleanup was verified: zero test schemas remained, and the task's temporary PostgreSQL server was stopped.

Integration tests reconcile SQL-backed ledger totals with dashboard/analytics and exact weekly/monthly dates, including fleet overhead, inactive/deleted records, mutation freshness, mileage chain edits/deletes and preserved vehicle history.

Browser tests cover authentication, denied access, search/profile, keyboard navigation, transaction CRUD/export/cancel, repair association, vehicle creation/editing/deactivation with retained inactive access, mileage create/edit/delete with verified odometer recalculation, operational evidence, date filters, comparisons, malformed inputs and all seven report types. Fifteen routes are checked in each theme at 320, 375, 390, 430, 768 and 1440 pixels, with assertions against horizontal document overflow, application console errors, HTTP 500s and invalid numerical output. Mobile/desktop screenshots are retained in ignored test artifacts and visually reviewed.

The initial failures were investigated rather than skipped: test-auth flag collision, selector ambiguities, a sign-out navigation race, resized tooltip overflow and comparison-panel sizing. Screenshot review also corrected low-contrast transaction sort headers and cramped table columns. Test data is synthetic and local; production records were not modified. See [reproduction instructions](testing.md).

Production compilation generated all 21 static pages and the dynamic route set successfully. Shared first-load JavaScript was 87.6 kB; dashboard 213 kB and analytics 219 kB. Webpack reported cache snapshot warnings in this Windows environment, without compilation failure. Vitest reported its existing Vite CJS API deprecation warning. These are build-tool observations, not a measured performance benchmark.

## Remaining limits and release acceptance

- No live deployment was performed. Preview authentication, real business-data reconciliation, actual provider uploads and production connectivity remain release checks in [deployment guidance](deployment.md).
- A dedicated test Blob store was not available; upload validation is tested, but end-to-end provider delivery is unverified.
- Warranty is free text; expiry dates and mileage limits cannot be asserted. Downtime intervals and vehicle availability are absent, so downtime and true utilization are unavailable.
- There is no structured vehicle document register, expiry/retention workflow or complete accounting/TCO ledger. Existing attachments remain supported. Configured premiums/EMI are not assumed to be paid expenses.
- Existing single-admin authentication remains. Multi-user roles, external integrations and private storage require explicit product and schema work.
- Browser execution uses Chromium. Safari/Firefox, real-device and formal assistive-technology testing remain outside this verification.
- Source-data omissions cannot be repaired by derived analytics. Data-quality findings direct the operator to evidence; replacement signals remain management review inputs.

## Useful future opportunities

Capture structured warranty and document metadata, repair start/completion intervals, vehicle availability and correctly classified finance/insurance payments. These would unlock defensible expiry alerts, downtime/utilization and fuller ownership cost. A private document store and role-based access would be appropriate if access expands beyond the existing administrator.
