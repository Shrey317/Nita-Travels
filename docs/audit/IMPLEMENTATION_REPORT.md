# Non-optional remediation — 29 October 2026

Status: non-optional remediation implemented locally, with passing coverage for the local verification checks below. Preview/live-provider verification and the noted intermittent observation remain release follow-ups. No production deployment or production database mutation has been performed. Optional product features remain deferred.

## Implemented

- Mileage-chain validation now rejects invalid historical edits atomically while preserving valid gaps after removal. Concurrent transaction edits lock the existing row before merging changes.
- Patched dependencies, Zod 4 compatibility and partial-update defaults. New attachments require application-store ownership and completed-object metadata; unchanged trusted historical references avoid provider revalidation. Unavailable and HEIC previews have fallbacks.
- Sanitized API, database, authentication and error-boundary logging. Added database readiness and explicit cross-origin browser-write rejection. Login attempt counters reset atomically without deleting records.
- Corrected dashboard destinations, overlapping fleet chart segments, service status thresholds, missing-data wording, invented KPI trends, repair scope labels and mileage allowance wording. Forms use Johannesburg business dates and clear opposite amounts on category changes.
- Implemented distinct light/dark palettes and accessible status/link/button contrast. Improved chart geometry, empty states and equivalent financial tables. Corrected profile and weekly-summary tablet layouts and dialog descriptions/containment.
- Forms remain disabled until their client handlers are ready, preventing initial values from being lost during hydration. Local HTTP builds explicitly avoid HTTPS resource upgrading on loopback; deployed origins retain it.
- Shared page/API filter validation, stable notes ordering, accurate empty pagination and URL-responsive vehicle filters. Timeline pagination now executes in PostgreSQL. Narrowed client props, indexed analytics grouping in memory, and streamed transaction CSV in batches of 500 without truncating history.
- Verification runs in an environment-file-free source copy with synthetic credentials and a dedicated loopback PostgreSQL service. Each integration file/browser project receives a fresh retained namespace. No reset, truncate, schema drop or bulk cleanup delete is used.

## Verification evidence

| Check | Result |
|---|---|
| Unit suite | 211 passed, 0 failed |
| Integration suite | 19 passed, 0 failed, across 10 files |
| Dependency audit | 0 runtime and 0 full-tree known vulnerabilities |
| Production build | Passed, including final browser-discovered fixes and public-origin validation |
| Lint / TypeScript | Passed in the latest production build |
| Chromium | Full run: 73 passed, one hidden-content selector failure; corrected selector and expanded accessibility/weekly rerun: 5 passed. Final form/accessibility/navigation run: 14 passed, one hidden search-input selector failure; corrected accessible selector and all six core workflows then passed. All checks have passing coverage, including the new delayed-JavaScript regression; no tests skipped |
| Firefox | Full run: 20 passed, 0 failed; final affected form/upload workflows: 11 passed, 0 failed, 0 skipped |
| WebKit | Final full run: 20 passed, 0 failed, 0 skipped; focused transaction persistence also passed three repeated runs |
| Focused dashboard load check | Passed, including loaded images |
| Legacy migration preservation | Passed: exact IDs, cents, dates, timestamps, nullable/ALLCR references, attachment order and inactive vehicle preserved |
| Batched CSV | Passed: 1,001 same-date records across three batches, no lost/duplicate rows |

Synthetic calculation benchmark (`scripts/benchmark-analytics.ts`), five runs per case, 99 vehicles: 1,000 transactions took 14–39 ms (mean 22 ms); 100,000 took 649–868 ms (mean 715 ms). Exact counts and money totals reconciled. These measure the pure calculation only, not database/network/render latency. Selected-history analytics still scales with the number of selected rows; no hidden record cap was introduced.

## Preservation and release limits

- No Prisma schema or historical migration changes were required. Migration fixtures were applied only to new synthetic namespaces.
- Manual odometer maxima remain authoritative. Source corrections do not guess a lower current odometer; the edit form explains manual review. Automatic provenance/backfill requires a separate policy decision.
- Existing public Blob access policy is preserved. A real provider upload/callback test requires a dedicated test store and remains unverified here; mocked transport must not be described as live-provider verification.
- Hard-delete note/mileage workflows were not executed. Mileage cancellation and rollback were checked; mocked removal-chain logic is covered separately.
- Deployment-specific cookie flags, proxy trust, callback reachability, operational backups/restore and a production smoke test remain release checks. The local benchmark is not a production capacity guarantee.
- An earlier WebKit run submitted a transaction with an empty note. Three diagnostic repeats and the final full run passed with explicit assertions for both the visible note and the server response. The omission was not reproduced and its cause is not established; retain this regression check during preview verification.
- Test schemas, local database files and artifacts are retained and git-ignored. Cleanup requires separately authorized handling. Expired login-counter keys are also retained; long-term key retention should be reviewed operationally if their volume grows.

Responsive coverage checks 21 routes in both themes at 375, 480, 768, 1024, 1280, 1440 and 1920 pixels (294 route/theme/width combinations). Expanded accessibility checks scan all 21 routes in both themes (42 scans). Dashboard screenshots were visually reviewed at mobile and desktop widths, including painted fleet-chart sectors.

## Artifacts

Unit/audit/benchmark output is under `test-results/`. Isolated build and integration logs are under `.local-verification/`; browser JSON, screenshots and traces are under its `test-results/` and `playwright-report/`. These contain synthetic fixtures only and are excluded from Git. The original audit remains a dated baseline, not a statement of the current implementation status.

Final browser summaries are `webkit-final-results.json`, `chromium-final-results.json`, `chromium-workflow-final-results.json`, and `firefox-final-results.json` in `.local-verification/test-results/`. The Chromium summaries deliberately retain the selector failure alongside its passing rerun rather than replacing the historical result.

The exact changed-file inventory is in [CHANGED_FILES.md](CHANGED_FILES.md). Deployment must configure `AUTH_URL` (or `NEXTAUTH_URL`) to the public origin; cross-origin write validation uses that same trusted origin rather than an internal proxy hostname.
