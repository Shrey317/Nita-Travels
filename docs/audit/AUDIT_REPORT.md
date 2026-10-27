# Nita Travels audit — 28 October 2026

Status: pre-implementation audit and decision document. Baseline: `a298fff`. No application code, schema, records, attachments, authentication settings or deployment was changed during this audit.

Evidence labels: **Confirmed** means demonstrated by source inspection, a calculation, or an executed check; **Risk** means a plausible failure requiring further reproduction or deployment evidence; **Improvement** means a proposed enhancement, not a discovered defect. Source inspection does not certify production behaviour. The accompanying inventory covers 279 tracked files, 244 TypeScript-family files structurally scanned, and 43 page/API routes. Detailed review covered business logic, persistence, routes, forms, authentication, configuration and major UI components. Whole-tree inventory is not a claim of exhaustive manual line-by-line review. Remaining runtime and detailed coverage requirements are explicit in the plan.

## 1. Executive summary

The existing architecture is worth retaining. Financial calculations are centralized, monetary records use integer cents, authenticated mutations use shared schemas, and transaction deletion preserves ledger history. Major remaining concerns are mileage integrity, dependency advisories, dashboard regressions, incomplete theme support and verification that has drifted from the current UI.

The baseline unit run completed with **199 passed, 2 failed, 0 skipped, 201 total**. Both failures concern historical mileage progression. Lint and typecheck passed. The dependency audit reported **9 affected package entries: 1 critical, 7 high, 1 moderate**; these are package counts including transitive chains, not nine independent exploitable flaws. The critical Next.js image advisory has a documented mitigation already present in the lockfile (`sharp` 0.35.5). A separate Next.js Server Actions advisory remains relevant. No exploit was attempted.

Integration, migration-preservation, production-build, browser and automated accessibility verification have not been completed for this audit. Existing database test tooling issues schema-drop and bulk-delete commands, incompatible with the user's current restrictions. It must be adapted before execution. Previous reports and screenshots are historical evidence, not fresh verification.

## 2. Architecture map

| Layer | Current implementation | Responsibility |
|---|---|---|
| Framework | Next.js 15.5.27 App Router, React 19.3, TypeScript | Server-rendered routes; client forms, filters and charts |
| Public/auth | `/login`, Auth.js handlers, exact public asset exceptions | Credentials login, redirects, session handling |
| Protected UI | Dashboard, vehicles/profile/edit, transactions, mileage, repairs, service, notes, weekly/monthly, analytics, reports, alerts, replacement, data quality | Fleet workflows and reporting |
| Authentication | `auth.ts`, `auth.config.ts`, `middleware.ts`, `lib/rate-limit.ts` | Single-admin credentials; bcrypt; JWT session; database-backed login limits |
| API | 22 route files under `app/api` | Session checks, schema parsing, mutation/query/export/upload responses |
| Domain | `lib/finance.ts`, `analytics.ts`, `periods.ts`, `date-ranges.ts`, `mileage*.ts`, `service.ts`, `health.ts`, `intelligence.ts`, `reports.ts` | Shared calculations and evidence rules |
| Persistence | `lib/db/*`, Prisma 5.18/PostgreSQL | Transactions, query filtering, relationships, soft deletion and mileage recomputation |
| UI | Tailwind semantic tokens, Radix primitives, Lucide, Recharts | Layout, dialogs, tables, forms, charts and feedback |
| Attachments | Vercel Blob, URL arrays on records | Direct browser upload; signed callback; public object URLs |
| Verification | Vitest, Playwright, GitHub Actions | Unit suites, isolated-schema integration, browser flows |

Data flows: request → middleware/session → route or server action → shared schema/query parser → DB helper → shared calculation → server page or JSON/CSV. Client mutations refresh routes and dispatch `fleet-data-changed`; notification hooks refresh their own data. Avoid adding another analytics or validation layer.

The file and route manifest is in `PROJECT_INVENTORY.md`. Four SQL migrations plus the migration lock file are inventoried. Public assets comprise a favicon SVG and the vehicle JPEG. Error boundaries exist at dashboard, root and global levels; most major routes have loading skeletons. Notes intentionally support creation/deletion rather than editing.

## 3. Existing features supported by evidence

The following are supported by code inspection and applicable passing unit tests, not a fresh end-to-end production certification:

- Central integer-cent revenue, expense, profit and margin calculations; null results for unavailable ratios rather than fabricated zeroes.
- Shared calendar boundaries and ISO-week aggregation; comparison and profit-contributor helpers; weekly/monthly reporting and CSV exports.
- Explicit fleet-wide `ALLCR`, unassigned `null`, inactive-vehicle and unallocated financial treatment.
- Transaction soft deletion and retained inactive vehicle profiles; vehicle-reference validation for real IDs without breaking sentinel references.
- Route-level authorization alongside middleware; generic client error messages; bcrypt credential comparison, login limits and short JWT lifetime.
- Schema validation of dates, amounts, mileage and attachment counts/URLs; CSV formula escaping; signed Blob callback verification.
- Form pending controls, confirmation dialogs, upload cancellation/error feedback, URL-based filters, search and notification invalidation.
- Shared accessible table wrappers, labeled inputs, skip link, keyboard-capable Radix primitives and reduced-motion CSS.
- Honest limitations for downtime, utilization, warranty dates and partial ownership cost. These must remain limitations until reliable data is captured.

## 4. Critical bugs

### F01 — Historical mileage progression is not enforced across the full chain — Confirmed, high integrity priority

`lib/mileage-chain.ts` validates only the changed reading against its predecessor. Successors and baseline-only recomputations can violate monotonic progression. `lib/mileage.ts` then clamps a negative distance to zero. Two existing tests fail: an edited reading passing its successor, and equal/below-baseline readings. A historical correction can therefore change derived distances incorrectly instead of rolling back.

Fix: enforce strict progression for every affected row while applying the existing 5,000 km new/edited-reading sanity rule only where appropriate. A legitimate gap created by deleting an intermediate reading must not be rejected solely because it exceeds 5,000 km. Reject invalid changes atomically; do not rewrite existing historical records automatically. Add integration rollback assertions.

No confirmed critical-severity application exploit or production data corruption was established. Dependency severity is discussed separately below.

## 5. High-priority security issues

### F02 — Dependency advisories — Confirmed version findings; exploitability varies

`next` 15.5.27 matches the [image-processing advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw) and [Server Actions CPU-exhaustion advisory](https://github.com/advisories/GHSA-p3m5-59mp-jv5r). The former describes glibc Linux exposure and names `sharp >= 0.35.5` as a workaround; the checked lockfile has 0.35.5. Do not describe this installation as confirmed remotely exploitable on that basis. This app does use Server Actions, so update Next.js and its matching ESLint configuration to a patched compatible release (15.5.28 is the advisory's patch), then verify auth, actions and assets.

Other reported package entries: Zod, Undici, source-map-js, postcss-selector-parser, Vite, and the Blob → OIDC → CLI-config transitive chain. The Zod recommendation is a major-version change, and npm's Blob fix suggestion is a downgrade. Do not run `npm audit fix --force`. Resolve each chain deliberately and rerun both full and runtime-only audits. Vite is development/test tooling, not this application's production server. Evidence: ignored local `test-results/audit-dependencies.json`.

### F03 — Attachment acceptance proves a provider host, not application ownership/completion — Confirmed gap

`lib/attachments.ts` accepts any matching public Blob subdomain and allowed extension. Record schemas do not prove that the object belongs to this application, completed an authorized upload, matches declared content, or respects actual object size. The signed completion callback currently does not bind completion to record persistence. Client-side validation and provider token restrictions are useful but do not close this record-write gap.

Prefer server-issued upload intent/completion evidence and explicit application-store ownership checks. Preserve existing URLs and records; do not retroactively discard attachments. Public Blob URLs are accessible to anyone possessing the URL: that is current storage behaviour, not evidence that URLs have leaked. A switch to private delivery is a separate product/migration decision.

### F04 — Unexpected errors are logged without sanitization — Confirmed unsafe path; no observed disclosure

`lib/api-response.ts` logs the whole unexpected error and `lib/db/client.ts` enables Prisma error logging. Error objects may contain query inputs or connection details. Replace with allowlisted codes and correlation identifiers, preserving safe diagnostics. Do not log secrets while testing redaction. Client-facing API messages are already generic.

### Additional security review

No raw user-controlled SQL interpolation was identified in the reviewed application paths. Generated test-schema identifiers are interpolated by tooling, not by HTTP input. Single-admin authorization does not require tenant-level ownership checks; multi-user tenancy is not currently a supported feature. Auth.js and same-site cookies provide existing auth/CSRF controls; explicit cross-origin mutation rejection should be verified with synthetic browser tests. Proxy/IP trust, deployed cookie flags, CSP response headers and Blob callback reachability require deployment evidence. Static CSP still allows inline scripts; nonce adoption is a later hardening improvement with auth/hydration regression risk, not an emergency rewrite.

## 6. Database and migration risks

| Area | Finding and preservation requirement |
|---|---|
| Models | Vehicle, Transaction, MileageEntry, VehicleNote, RateLimit; money and mileage are PostgreSQL integers; calendar dates use SQL DATE |
| Relationships | Mileage has a real vehicle FK. Transaction/note vehicle references deliberately omit an FK to allow `ALLCR` and null; preserve application checks |
| Soft deletion | Vehicle/Transaction have nullable `deletedAt`; notes/mileage currently hard-delete through explicit UI actions. Do not silently alter deletion contracts or automatically purge anything |
| Historical odometer | F01 must reject invalid edits within a transaction. No bulk history repair is authorized |
| Service odometer correction (F05) | Transaction creation/update can raise `currentMileageKm`; downward edits, reassignment and soft deletion do not undo that contribution. A stale high reading is possible. Manual authoritative readings are not separately identifiable, so recomputation policy needs a decision before lowering stored odometers |
| Concurrent edits (F06) | `updateTransaction` reads/merges before its write transaction, then writes the merged object. Concurrent edits can overwrite each other. Test and use locking or an explicit version conflict response |
| Indexes | Existing single-column indexes and mileage year/week index are present. Composite vehicle/date/deletedAt indexes are candidates, not justified additions without synthetic query-plan measurements |
| Migration assurance | Existing migrations include initial schema, sentinel-reference changes, rate limits and soft-delete columns. No legacy-shaped-record preservation run was performed in this audit |

Additive migrations only after review; preserve IDs, cents, timestamps, attachments and nullable/sentinel values. Do not guess missing service readings or warranty dates. Backups and restore rehearsal must use designated environments; audit work does not authorize running the repository restore script against an existing database.

## 7. Financial and analytics correctness issues

- **F07 — Confirmed:** `fleet-status.tsx` uses Active + Attention Required + Inactive as pie slices even though attention overlaps active vehicles. Values do not reconcile to the fleet total. Use disjoint segments or a separate attention indicator.
- **F08 — Confirmed:** dashboard `upcoming-services.tsx` duplicates the service warning threshold as 1,500 km instead of using shared status. It displays missing service history as “Never” and missing mileage with a positive color. Reuse `lib/service.ts` status and say “Not recorded.”
- **F09 — Confirmed:** mileage table labels the per-reading distance allowance as weekly utilization/within-limit, while analytics assess summed vehicle-weeks. Two individually permitted readings can exceed the weekly allowance. Preserve stored history; distinguish per-reading distance from weekly compliance. Mileage alert copy says “last 7 days” although its page queries the current ISO week.
- **F10 — Confirmed:** transaction/mileage/note date defaults use UTC ISO slicing rather than the business-date helper. Between midnight and 02:00 Johannesburg, a new entry can default to yesterday.
- **F11 — Confirmed:** decorative rising sparklines in fleet KPI cards are not backed by historical counts. Remove them rather than imply a trend.
- **F12 — Confirmed scope mismatch:** repair summary/anomaly queries do not receive the table's filters. Label their independent scope or apply a common selection; do not imply filtered totals. Repair “fleet average” definitions also differ by query and should be explicitly named.
- **Risks requiring focused fixtures:** deterministic same-date service selection; treatment of future service records; rolling-window day boundaries; cent-rounding reconciliation for scaled comparisons; excessive configured finance terms exceeding safe arithmetic ranges. These are not all demonstrated financial errors.

Keep the existing shared financial engine. Preserve partial-TCO caveats, non-allocation of overhead, recorded-distance attribution and unavailable values. Do not introduce depreciation, resale, downtime, true utilization or finance interest without data and an approved rule.

## 8. UX and visual issues

- **F13 — Confirmed:** recent transaction links target `/transactions/{id}`, for which there is no page. The supported edit deep link is `/transactions?txId=...`.
- **F14 — Confirmed:** upcoming-service links carry a vehicle filter ignored by `/service`. Link to the relevant profile/service section or implement a validated filter.
- **F15 — Confirmed:** `:root, .dark` share dark values; root layout/body use hardcoded dark colors. The theme toggle changes a class but does not deliver a light theme.
- **F16 — Confirmed:** classes such as `text-error`, `text-warning`, `text-info`, `text-bright-blue` and matching backgrounds are used without corresponding Tailwind color keys. Standardize on existing semantic names, including the shared primitives.
- **F17 — Confirmed state risk in source:** transaction category changes can leave a positive amount in the hidden income/expense field. Submission then fails validation for a field the user cannot see. Explicitly manage category transitions and preserve existing stored values until the user chooses a change.
- **F18 — Confirmed:** dashboard “Recent Vehicles” receives the report vehicle list without a recency sort. Sort by meaningful recency or rename the section.
- **Runtime checks pending:** narrow dashboard metric cards may clip long amounts; chart percentage heights need measured containers; fleet-card fixed widths may overflow; dashboard empty chart state checks array length despite zero-filled periods. Test with empty, negative, large and long-label synthetic records at all requested widths.
- Generic errors/retry UI and loading states exist. Improve contextual recovery rather than replace working navigation/forms.

## 9. Accessibility issues

**F19 — Confirmed token-level contrast failures:** computed sRGB contrast is 4.24:1 for muted `#728199` on card `#101E32`, 3.48:1 for white text on destructive `#F05252`, and 3.72:1 for primary `#2F6BFF` text on card. These fail 4.5:1 for normal text. This is a palette calculation, not a complete rendered WCAG audit; opacity and actual usage must be checked in both themes.

Dashboard charts lack the equivalent accessible treatment used by the weekly/period charts. Provide named regions and tabular data, and verify keyboard interaction. Several dialogs supply a title without a description; verify Radix console warnings and meaningful accessible descriptions. Delete dialogs lack the viewport-height containment present on normal dialogs. Global error/not-found messages use paragraphs instead of a page heading. Status must not rely on color alone. Retain the working skip link, labels, focus management, scrollable-table keyboard access and reduced-motion support.

No automated accessibility scan or screen-reader certification was performed. Native semantic inspection alone is insufficient to mark accessibility PASS.

## 10. Performance issues

**F20 — Confirmed unbounded loading; scale impact unmeasured:** analytics/report/export helpers load entire selected histories into arrays; “all history” has no record bound. Vehicle timeline loads and combines history before slicing for pagination. Date-bounded does not mean row-bounded. Repeated grouping/filtering and array copying add avoidable work. Profile and dashboard compose overlapping queries.

First measure representative synthetic volumes, query counts, payload sizes and p95 response times. Then implement DB-level pagination and aggregates or streamed exports while comparing results to the existing shared rules. Do not truncate exports or quietly discard old history.

**F21 — Confirmed:** dashboard client components receive full report/vehicle objects beyond their rendering needs. Pass narrow DTOs; retain server computation. Reports and operational status are dynamic, so avoid caching mutable financial data without complete invalidation. Chart bundles are a measurement target, not grounds for adding another chart library.

## 11. Code-quality issues

**F22 — Confirmed:** API list routes use `parseListQuery`, but several server pages parse raw dates and numeric pages independently and pass them to DB helpers. Fractional/negative pages and invalid dates can become server errors rather than validated filter feedback. Reuse the shared parser through a search-param adapter; do not create another schema set.

Notes pagination sorts only by date; add a stable tie-breaker. Pagination also needs an honest empty/out-of-range presentation. Vehicle list filter state is initialized from URL values but not synchronized with later URL changes. `syncVehicleMileageFromService` accepts an unused category argument and its name understates actual behaviour. UI/category labels, service thresholds and date formatting have small duplications. Comments describing old UI or old query behaviour should be corrected only alongside relevant changes. Large form/profile components can be extracted incrementally if that improves testing; no broad rewrite is needed.

## 12. Testing gaps

**F23 — Confirmed:** `scripts/safe-exec.ts` drops its disposable schema, and `vitest.setup.ts` bulk-deletes fixture tables. Several integration/browser suites also delete records directly. Existing identity safeguards are useful, but these commands conflict with the current no-destructive-command instruction. They were not run.

**F24 — Confirmed:** the runner spreads inherited environment values and sets `NEXTAUTH_URL` without overriding `AUTH_URL`. Test auth origin can therefore be inherited incorrectly. Other provider environment values are also retained. Use an allowlist and a test-only source/build directory excluding environment files; generate synthetic auth inputs in memory and never print them.

**F25 — Confirmed:** `e2e/usability.spec.ts` asserts removed dashboard regions/details. Responsive coverage omits requested 480, 1280 and 1920 widths; class-only theme assertions do not catch F15. It checks document overflow but misses clipped children inside overflow-hidden containers. No automated accessibility dependency/scan is configured. Migration-on-empty-database testing is not preservation testing.

Required additions: mileage rollback and same-day order, transaction edit concurrency, query-page validation, form category transitions, business-midnight defaults, chart/data reconciliation, completed-upload evidence, duplicate submissions, actual theme colors, all required widths, dialog keyboard/focus checks, and synthetic legacy migrations. Tests should assert user behaviour and reconciliation rather than CSS implementation details.

## 13. Deployment risks

- No new production build has been verified in this audit. Next loads local environment files; run future build/browser work from a source copy excluding those files and with synthetic environment values.
- CI has isolated PostgreSQL and several useful gates, but the dependency audit currently fails and two unit cases fail before browser coverage. Existing CI cleanup also conflicts with this task's test restrictions.
- `/api/health` returns process-level success, not database readiness. Connection UI must not describe that as proof that persistence works. A readiness check should return sanitized status without exposing connection data.
- Deployment settings, provider permissions, callback delivery, actual production dependency graph, backup recovery and TLS/cookie behaviour are not verified by repository inspection.
- Do not deploy this baseline as “verified.” Follow the staged plan and reconcile any data/schema compatibility before release.

## 14. Prioritized recommendations

| Priority | Recommendations |
|---|---|
| Critical dependency triage | F02: apply compatible patched Next.js; record existing image-advisory mitigation and verify remaining chains |
| High | F01 mileage integrity; F23–24 safe isolated testing; F03 upload completion/ownership; F04 log redaction; F05 odometer policy; F06 concurrent edits; F07 chart reconciliation; F10 dates; F13 broken links; F17 blocked form changes |
| Medium | F08–09 service/mileage consistency; F12 filter scope; F15–16 themes/tokens; F19 accessibility; F20 performance measurement and pagination; F22 query validation; F25 browser coverage |
| Low | F11 decorative charts; F14 destination refinement; F18 section naming/sorting; F21 DTO narrowing; documentation and obsolete comments |

## 15. Files affected by recommendations

| IDs | Main implementation/test files |
|---|---|
| F01 | `lib/mileage-chain.ts`, `lib/db/mileage.ts`, mileage-chain unit and mileage/vehicle-mileage integration suites |
| F02 | `package.json`, `package-lock.json`; schema/API code only if a reviewed major dependency migration requires it |
| F03 | `lib/attachments.ts`, `app/api/upload/route.ts`, attachment schemas and upload UI/tests; possibly a new additive upload-intent model/migration |
| F04 | `lib/api-response.ts`, `lib/db/client.ts`, safe logging helper and security tests |
| F05–06 | `lib/db/transactions.ts`, `lib/db/mileage.ts`, `lib/db/vehicles.ts`, mutation integration tests; model changes only after policy decision |
| F07–08, F11, F13–14, F18, F21 | `components/dashboard/*`, `app/(dashboard)/page.tsx`, optionally service page; dashboard/browser regression tests |
| F09–10 | `components/mileage/*`, form components, `lib/date-ranges.ts`, mileage/date tests |
| F12 | Repairs page/components and `lib/db/transactions.ts`; query/reconciliation fixtures |
| F15–16, F19 | `app/globals.css`, `app/layout.tsx`, `tailwind.config.ts`, shared UI/chart styles, semantic-color consumers, browser/a11y suites |
| F17 | `components/transactions/transaction-form.tsx`, transaction workflow tests |
| F20, F22 | `lib/db/*`, `lib/query-filters.ts`, filtered server pages, pagination; measured query/index changes only |
| F23–25 | `scripts/safe-exec.ts`, `vitest.setup.ts`, test configs, integration/E2E fixtures, `e2e/*`, CI and testing docs |

## 16. Change risks and expected benefits

| Change group | Risk | Benefit / guardrail |
|---|---|---|
| Dependency patches | Medium | Removes advisory exposure; verify auth/actions/uploads and do not force major upgrades |
| Mileage validation | Medium | Prevents invalid derived distance; transaction rollback, valid deletion gaps and legacy preservation required |
| Test isolation | Medium | Enables trustworthy checks without production credentials or destructive cleanup |
| Attachment provenance | Medium–high | Prevents arbitrary provider objects from being accepted; staged compatibility for legacy attachments |
| Odometer provenance | High if guessed | Accurate corrections; requires explicit policy before changing recorded readings |
| Shared query/form/date fixes | Low–medium | Predictable inputs and working workflows; preserve schema rules |
| Themes/a11y/charts | Medium visual regression risk | Readable, truthful, keyboard-accessible UI; check both themes at seven widths |
| Query/index changes | Medium | Better scale; require measured plans and exact reconciliation, no silent result caps |

## 17. Features and data that must not change

Preserve routes, single-admin auth/session behaviour, credentials configuration, historical IDs/dates/cents, attachments, inactive vehicle access, `ALLCR`/null semantics, transaction soft deletion, explicit note deletion workflow, shared money and calendar rules, service derivation, upload ordering/cancellation, CSV safety, and explicit unavailable-data/partial-TCO caveats. Keep the recent login and welcome-banner designs while fixing verified defects. Do not seed production, alter old migrations, bulk-repair history, delete files/records, or invent operating metrics.

## 18. Decisions requiring clarification

1. Approve the implementation batches in `IMPLEMENTATION_PLAN.md`. The user's brief explicitly says “Implement the approved improvements”; this report makes the proposed scope reviewable before application edits.
2. Odometer corrections: should an explicitly entered manual reading remain authoritative after a service transaction is corrected/deleted? Recommended: preserve it until provenance can distinguish manual from derived values. Do not guess or lower historical odometers automatically.
3. Attachment access: is current possession-of-public-URL access acceptable, or must every download require login? Recommended initial batch: strengthen new-upload provenance while preserving existing links; private delivery requires a separate migration decision.

Routine layout, test-fixture and implementation choices do not need further approval once the scope is approved. No request to disclose production credentials is needed.

## Baseline verification record

```text
Unit tests:
Passed: 199
Failed: 2
Skipped: 0

Integration tests:
Passed: 0
Failed: 0
Skipped: 0
Status: NOT RUN (runner conflicts with no-destructive-command restriction)

Browser tests:
Passed: 0
Failed: 0
Skipped: 0
Status: NOT RUN for this audit

Typecheck: PASS
Lint: PASS
Production build: NOT RUN for this audit
Dependency audit: FAIL (9 affected package entries; qualifications above)
Accessibility checks: FAIL at palette level; automated/rendered scans NOT RUN
Migration preservation: NOT RUN
Formatting: no dedicated formatter check configured; not independently verified
```

The initial sandbox unit attempt had module temporary-file failures and is superseded by the completed 201-test run. Automatic review initially rejected an unrestricted retry. After inspection established that the unit config excludes integration setup and DB clients are mocked, a direct credential-cleared unit invocation was approved and completed. No database cleanup or production data access was used for these unit tests.
