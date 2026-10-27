# Project inventory — 28 October 2026

Baseline commit: a298fff. 279 tracked files inventoried. Private environment contents were excluded. Generated build output, installed dependencies, and ignored local artifacts are outside the source inventory.

Coverage: whole-tree file classification and TypeScript import/call inspection, plus detailed manual review of routes, domain logic, persistence, authentication, forms, charts, configuration and test safety. This inventory is not a claim that every source line has received manual review or every screen has been exercised. Remaining runtime work is specified in IMPLEMENTATION_PLAN.md.

## Routes

| Route | Methods | Source |
|---|---|---|
| `/login` | Page | `app/(auth)/login/page.tsx` |
| `/alerts` | Page | `app/(dashboard)/alerts/page.tsx` |
| `/analytics` | Page | `app/(dashboard)/analytics/page.tsx` |
| `/data-quality` | Page | `app/(dashboard)/data-quality/page.tsx` |
| `/mileage/new` | Page | `app/(dashboard)/mileage/new/page.tsx` |
| `/mileage` | Page | `app/(dashboard)/mileage/page.tsx` |
| `/monthly` | Page | `app/(dashboard)/monthly/page.tsx` |
| `/notes` | Page | `app/(dashboard)/notes/page.tsx` |
| `/` | Page | `app/(dashboard)/page.tsx` |
| `/repairs` | Page | `app/(dashboard)/repairs/page.tsx` |
| `/replacement` | Page | `app/(dashboard)/replacement/page.tsx` |
| `/reports` | Page | `app/(dashboard)/reports/page.tsx` |
| `/service` | Page | `app/(dashboard)/service/page.tsx` |
| `/transactions/new` | Page | `app/(dashboard)/transactions/new/page.tsx` |
| `/transactions` | Page | `app/(dashboard)/transactions/page.tsx` |
| `/vehicles/[id]/edit` | Page | `app/(dashboard)/vehicles/[id]/edit/page.tsx` |
| `/vehicles/[id]/notes/new` | Page | `app/(dashboard)/vehicles/[id]/notes/new/page.tsx` |
| `/vehicles/[id]` | Page | `app/(dashboard)/vehicles/[id]/page.tsx` |
| `/vehicles/new` | Page | `app/(dashboard)/vehicles/new/page.tsx` |
| `/vehicles` | Page | `app/(dashboard)/vehicles/page.tsx` |
| `/weekly` | Page | `app/(dashboard)/weekly/page.tsx` |
| `/api/analytics` | GET | `app/api/analytics/route.ts` |
| `/api/auth/[...nextauth]` | GET, POST | `app/api/auth/[...nextauth]/route.ts` |
| `/api/dashboard` | GET | `app/api/dashboard/route.ts` |
| `/api/health` | GET | `app/api/health/route.ts` |
| `/api/mileage/[id]` | PATCH, DELETE | `app/api/mileage/[id]/route.ts` |
| `/api/mileage/export` | GET | `app/api/mileage/export/route.ts` |
| `/api/mileage/previous/[vehicleId]` | GET | `app/api/mileage/previous/[vehicleId]/route.ts` |
| `/api/mileage` | GET, POST | `app/api/mileage/route.ts` |
| `/api/monthly` | GET | `app/api/monthly/route.ts` |
| `/api/nav-badges` | GET | `app/api/nav-badges/route.ts` |
| `/api/notes/[id]` | DELETE | `app/api/notes/[id]/route.ts` |
| `/api/notes` | GET, POST | `app/api/notes/route.ts` |
| `/api/notifications` | GET | `app/api/notifications/route.ts` |
| `/api/reports/export` | GET | `app/api/reports/export/route.ts` |
| `/api/service` | GET | `app/api/service/route.ts` |
| `/api/transactions/[id]` | PATCH, DELETE | `app/api/transactions/[id]/route.ts` |
| `/api/transactions/export` | GET | `app/api/transactions/export/route.ts` |
| `/api/transactions` | GET, POST | `app/api/transactions/route.ts` |
| `/api/upload` | POST | `app/api/upload/route.ts` |
| `/api/vehicles/[id]` | GET, PATCH, DELETE | `app/api/vehicles/[id]/route.ts` |
| `/api/vehicles/[id]/timeline` | GET | `app/api/vehicles/[id]/timeline/route.ts` |
| `/api/vehicles` | GET, POST | `app/api/vehicles/route.ts` |

## File manifest

| File | Area | Lines |
|---|---|---|
| `.editorconfig` | Configuration | 13 |
| `.env.example` | Configuration | 19 |
| `.eslintrc.json` | Configuration | 9 |
| `.github/workflows/ci.yml` | Configuration | 55 |
| `.gitignore` | Configuration | 24 |
| `.nvmrc` | Configuration | 2 |
| `.vercelignore` | Configuration | 10 |
| `README.md` | Configuration | 45 |
| `__tests__/integration/analytics.test.ts` | Test | 59 |
| `__tests__/integration/health.test.ts` | Test | 121 |
| `__tests__/integration/mileage.test.ts` | Test | 105 |
| `__tests__/integration/notifications.test.ts` | Test | 94 |
| `__tests__/integration/rate-limit.test.ts` | Test | 27 |
| `__tests__/integration/vehicle-mileage.test.ts` | Test | 31 |
| `__tests__/integration/weekly.test.ts` | Test | 121 |
| `__tests__/lib/alerts.test.ts` | Test | 61 |
| `__tests__/lib/analytics.test.ts` | Test | 130 |
| `__tests__/lib/authentication.test.ts` | Test | 55 |
| `__tests__/lib/finance.test.ts` | Test | 83 |
| `__tests__/lib/format.test.ts` | Test | 106 |
| `__tests__/lib/mileage-chain.test.ts` | Test | 38 |
| `__tests__/lib/mileage.test.ts` | Test | 75 |
| `__tests__/lib/mutation-integrity.test.ts` | Test | 56 |
| `__tests__/lib/rate-limit.test.ts` | Test | 27 |
| `__tests__/lib/schemas.test.ts` | Test | 211 |
| `__tests__/lib/security.test.ts` | Test | 89 |
| `__tests__/lib/service.test.ts` | Test | 125 |
| `__tests__/lib/test-environment.test.ts` | Test | 29 |
| `__tests__/lib/upload-route.test.ts` | Test | 42 |
| `app/(auth)/login/components/BrandLogo.tsx` | Page/layout/style | 16 |
| `app/(auth)/login/components/FeatureItem.tsx` | Page/layout/style | 12 |
| `app/(auth)/login/components/LoginForm.tsx` | Page/layout/style | 116 |
| `app/(auth)/login/components/LoginHero.tsx` | Page/layout/style | 25 |
| `app/(auth)/login/components/RouteBackground.tsx` | Page/layout/style | 21 |
| `app/(auth)/login/login.module.css` | Page/layout/style | 148 |
| `app/(auth)/login/page.tsx` | Page/layout/style | 46 |
| `app/(dashboard)/actions.ts` | Page/layout/style | 8 |
| `app/(dashboard)/alerts/loading.tsx` | Page/layout/style | 2 |
| `app/(dashboard)/alerts/page.tsx` | Page/layout/style | 27 |
| `app/(dashboard)/analytics/loading.tsx` | Page/layout/style | 19 |
| `app/(dashboard)/analytics/page.tsx` | Page/layout/style | 22 |
| `app/(dashboard)/data-quality/loading.tsx` | Page/layout/style | 2 |
| `app/(dashboard)/data-quality/page.tsx` | Page/layout/style | 19 |
| `app/(dashboard)/error.tsx` | Page/layout/style | 24 |
| `app/(dashboard)/layout.tsx` | Page/layout/style | 30 |
| `app/(dashboard)/loading.tsx` | Page/layout/style | 20 |
| `app/(dashboard)/mileage/loading.tsx` | Page/layout/style | 18 |
| `app/(dashboard)/mileage/new/page.tsx` | Page/layout/style | 26 |
| `app/(dashboard)/mileage/page.tsx` | Page/layout/style | 97 |
| `app/(dashboard)/monthly/loading.tsx` | Page/layout/style | 15 |
| `app/(dashboard)/monthly/page.tsx` | Page/layout/style | 63 |
| `app/(dashboard)/notes/loading.tsx` | Page/layout/style | 18 |
| `app/(dashboard)/notes/page.tsx` | Page/layout/style | 59 |
| `app/(dashboard)/page.tsx` | Page/layout/style | 68 |
| `app/(dashboard)/repairs/loading.tsx` | Page/layout/style | 20 |
| `app/(dashboard)/repairs/page.tsx` | Page/layout/style | 55 |
| `app/(dashboard)/replacement/loading.tsx` | Page/layout/style | 2 |
| `app/(dashboard)/replacement/page.tsx` | Page/layout/style | 25 |
| `app/(dashboard)/reports/loading.tsx` | Page/layout/style | 2 |
| `app/(dashboard)/reports/page.tsx` | Page/layout/style | 25 |
| `app/(dashboard)/service/loading.tsx` | Page/layout/style | 15 |
| `app/(dashboard)/service/page.tsx` | Page/layout/style | 20 |
| `app/(dashboard)/transactions/loading.tsx` | Page/layout/style | 21 |
| `app/(dashboard)/transactions/new/page.tsx` | Page/layout/style | 26 |
| `app/(dashboard)/transactions/page.tsx` | Page/layout/style | 85 |
| `app/(dashboard)/vehicles/[id]/edit/page.tsx` | Page/layout/style | 26 |
| `app/(dashboard)/vehicles/[id]/loading.tsx` | Page/layout/style | 22 |
| `app/(dashboard)/vehicles/[id]/notes/new/page.tsx` | Page/layout/style | 30 |
| `app/(dashboard)/vehicles/[id]/page.tsx` | Page/layout/style | 311 |
| `app/(dashboard)/vehicles/client-page.tsx` | Page/layout/style | 216 |
| `app/(dashboard)/vehicles/loading.tsx` | Page/layout/style | 21 |
| `app/(dashboard)/vehicles/new/page.tsx` | Page/layout/style | 16 |
| `app/(dashboard)/vehicles/page.tsx` | Page/layout/style | 12 |
| `app/(dashboard)/weekly/page.tsx` | Page/layout/style | 59 |
| `app/api/analytics/route.ts` | API | 13 |
| `app/api/auth/[...nextauth]/route.ts` | API | 6 |
| `app/api/dashboard/route.ts` | API | 14 |
| `app/api/health/route.ts` | API | 13 |
| `app/api/mileage/[id]/route.ts` | API | 35 |
| `app/api/mileage/export/route.ts` | API | 25 |
| `app/api/mileage/previous/[vehicleId]/route.ts` | API | 19 |
| `app/api/mileage/route.ts` | API | 35 |
| `app/api/monthly/route.ts` | API | 22 |
| `app/api/nav-badges/route.ts` | API | 17 |
| `app/api/notes/[id]/route.ts` | API | 19 |
| `app/api/notes/route.ts` | API | 35 |
| `app/api/notifications/route.ts` | API | 16 |
| `app/api/reports/export/route.ts` | API | 25 |
| `app/api/service/route.ts` | API | 16 |
| `app/api/transactions/[id]/route.ts` | API | 36 |
| `app/api/transactions/export/route.ts` | API | 25 |
| `app/api/transactions/route.ts` | API | 35 |
| `app/api/upload/route.ts` | API | 45 |
| `app/api/vehicles/[id]/route.ts` | API | 49 |
| `app/api/vehicles/[id]/timeline/route.ts` | API | 24 |
| `app/api/vehicles/route.ts` | API | 29 |
| `app/error.tsx` | Page/layout/style | 34 |
| `app/global-error.tsx` | Page/layout/style | 34 |
| `app/globals.css` | Page/layout/style | 119 |
| `app/layout.tsx` | Page/layout/style | 36 |
| `app/not-found.tsx` | Page/layout/style | 27 |
| `auth.config.ts` | Configuration | 37 |
| `auth.ts` | Configuration | 54 |
| `components/analytics/analytics-content.tsx` | UI component | 62 |
| `components/analytics/analytics-filters.tsx` | UI component | 56 |
| `components/analytics/financial-snapshot.tsx` | UI component | 51 |
| `components/analytics/period-trend-chart.tsx` | UI component | 19 |
| `components/analytics/profit-bridge.tsx` | UI component | 17 |
| `components/analytics/vehicle-comparison.tsx` | UI component | 45 |
| `components/dashboard/alerts-panel.tsx` | UI component | 64 |
| `components/dashboard/dashboard-hero.module.css` | UI component | 79 |
| `components/dashboard/dashboard-hero.tsx` | UI component | 76 |
| `components/dashboard/financial-overview.tsx` | UI component | 142 |
| `components/dashboard/fleet-kpis.tsx` | UI component | 82 |
| `components/dashboard/fleet-status.tsx` | UI component | 121 |
| `components/dashboard/recent-transactions.tsx` | UI component | 54 |
| `components/dashboard/service-overview-table.tsx` | UI component | 60 |
| `components/dashboard/todays-priorities.tsx` | UI component | 91 |
| `components/dashboard/upcoming-services.tsx` | UI component | 82 |
| `components/dashboard/vehicle-summary-table.tsx` | UI component | 140 |
| `components/finance/year-selector.tsx` | UI component | 42 |
| `components/layout/command-palette.tsx` | UI component | 173 |
| `components/layout/connection-status.tsx` | UI component | 21 |
| `components/layout/mobile-navigation.tsx` | UI component | 39 |
| `components/layout/nav-config.ts` | UI component | 50 |
| `components/layout/notification-center.tsx` | UI component | 61 |
| `components/layout/profile-menu.tsx` | UI component | 58 |
| `components/layout/sidebar.tsx` | UI component | 210 |
| `components/layout/theme-provider.tsx` | UI component | 82 |
| `components/layout/topbar.tsx` | UI component | 47 |
| `components/mileage/edit-mileage-dialog.tsx` | UI component | 152 |
| `components/mileage/latest-mileage-table.tsx` | UI component | 48 |
| `components/mileage/mileage-alerts.tsx` | UI component | 63 |
| `components/mileage/mileage-form.tsx` | UI component | 210 |
| `components/mileage/mileage-table.tsx` | UI component | 112 |
| `components/monthly/monthly-chart.tsx` | UI component | 62 |
| `components/monthly/monthly-table.tsx` | UI component | 56 |
| `components/notes/note-form.tsx` | UI component | 153 |
| `components/notes/notes-table.tsx` | UI component | 89 |
| `components/repairs/repairs-anomalies.tsx` | UI component | 36 |
| `components/repairs/repairs-summary-cards.tsx` | UI component | 49 |
| `components/repairs/repairs-table.tsx` | UI component | 64 |
| `components/service/service-table.tsx` | UI component | 103 |
| `components/shared/chart-style.ts` | UI component | 23 |
| `components/shared/client-only-chart.tsx` | UI component | 36 |
| `components/shared/delete-confirm-dialog.tsx` | UI component | 87 |
| `components/shared/detail-section.tsx` | UI component | 23 |
| `components/shared/empty-state.tsx` | UI component | 31 |
| `components/shared/field-error.tsx` | UI component | 16 |
| `components/shared/multi-select.tsx` | UI component | 63 |
| `components/shared/page-header.tsx` | UI component | 29 |
| `components/shared/pagination.tsx` | UI component | 71 |
| `components/shared/photo-thumbnails.tsx` | UI component | 69 |
| `components/shared/photo-upload.tsx` | UI component | 123 |
| `components/shared/section-heading.tsx` | UI component | 25 |
| `components/shared/sortable-header.tsx` | UI component | 65 |
| `components/shared/vehicle-date-filters.tsx` | UI component | 86 |
| `components/shared/vehicle-options.ts` | UI component | 12 |
| `components/transactions/transaction-filters.tsx` | UI component | 151 |
| `components/transactions/transaction-form.tsx` | UI component | 264 |
| `components/transactions/transaction-table.tsx` | UI component | 145 |
| `components/ui/alert-dialog.tsx` | UI component | 103 |
| `components/ui/badge.tsx` | UI component | 31 |
| `components/ui/button.tsx` | UI component | 47 |
| `components/ui/card.tsx` | UI component | 49 |
| `components/ui/checkbox.tsx` | UI component | 27 |
| `components/ui/dialog.tsx` | UI component | 94 |
| `components/ui/input.tsx` | UI component | 25 |
| `components/ui/label.tsx` | UI component | 19 |
| `components/ui/popover.tsx` | UI component | 29 |
| `components/ui/select.tsx` | UI component | 106 |
| `components/ui/skeleton.tsx` | UI component | 16 |
| `components/ui/table.tsx` | UI component | 72 |
| `components/ui/textarea.tsx` | UI component | 24 |
| `components/ui/toast.tsx` | UI component | 109 |
| `components/ui/toaster.tsx` | UI component | 32 |
| `components/ui/tooltip.tsx` | UI component | 31 |
| `components/ui/use-toast.ts` | UI component | 126 |
| `components/vehicles/activity-timeline-table.tsx` | UI component | 84 |
| `components/vehicles/activity-timeline.tsx` | UI component | 15 |
| `components/vehicles/deactivate-vehicle-button.tsx` | UI component | 90 |
| `components/vehicles/financial-chart.tsx` | UI component | 39 |
| `components/vehicles/health-card.tsx` | UI component | 111 |
| `components/vehicles/info-card.tsx` | UI component | 26 |
| `components/vehicles/replacement-card.tsx` | UI component | 73 |
| `components/vehicles/timeline-filters.tsx` | UI component | 102 |
| `components/vehicles/vehicle-card.tsx` | UI component | 45 |
| `components/vehicles/vehicle-form.tsx` | UI component | 425 |
| `components/weekly/weekly-chart.tsx` | UI component | 33 |
| `components/weekly/weekly-range-selector.tsx` | UI component | 45 |
| `components/weekly/weekly-summary.tsx` | UI component | 66 |
| `components/weekly/weekly-table.tsx` | UI component | 80 |
| `docs/MODERNIZATION_REPORT.md` | Documentation | 69 |
| `docs/PRODUCTION_TRANSFORMATION_REPORT.md` | Documentation | 125 |
| `docs/V2_GAP_ANALYSIS.md` | Documentation | 48 |
| `docs/architecture.md` | Documentation | 74 |
| `docs/deployment.md` | Documentation | 28 |
| `docs/financial_metrics.md` | Documentation | 87 |
| `docs/history/ui-ux-audit.md` | Documentation | 80 |
| `docs/history/ui-ux-changelog.md` | Documentation | 29 |
| `docs/testing.md` | Documentation | 50 |
| `e2e/auth-release.spec.ts` | Test | 49 |
| `e2e/core-workflow.spec.ts` | Test | 85 |
| `e2e/core.spec.ts` | Test | 28 |
| `e2e/global.setup.ts` | Test | 10 |
| `e2e/helpers.ts` | Test | 12 |
| `e2e/intelligence.spec.ts` | Test | 53 |
| `e2e/responsive.spec.ts` | Test | 40 |
| `e2e/uploads.spec.ts` | Test | 78 |
| `e2e/usability.spec.ts` | Test | 108 |
| `e2e/vehicle-mutations.spec.ts` | Test | 58 |
| `e2e/weekly.spec.ts` | Test | 38 |
| `instrumentation.ts` | Configuration | 13 |
| `lib/actions/search.ts` | Domain/data helper | 76 |
| `lib/alerts.ts` | Domain/data helper | 49 |
| `lib/analytics.ts` | Domain/data helper | 188 |
| `lib/api-response.ts` | Domain/data helper | 56 |
| `lib/attachments.ts` | Domain/data helper | 50 |
| `lib/constants.ts` | Domain/data helper | 38 |
| `lib/csv.ts` | Domain/data helper | 6 |
| `lib/date-ranges.ts` | Domain/data helper | 122 |
| `lib/db/analytics.ts` | Domain/data helper | 168 |
| `lib/db/client.ts` | Domain/data helper | 38 |
| `lib/db/mileage.ts` | Domain/data helper | 222 |
| `lib/db/monthly.ts` | Domain/data helper | 25 |
| `lib/db/notes.ts` | Domain/data helper | 65 |
| `lib/db/notifications.ts` | Domain/data helper | 83 |
| `lib/db/periods.ts` | Domain/data helper | 15 |
| `lib/db/safety.ts` | Domain/data helper | 22 |
| `lib/db/service.ts` | Domain/data helper | 133 |
| `lib/db/transactions.ts` | Domain/data helper | 279 |
| `lib/db/vehicle-reference.ts` | Domain/data helper | 11 |
| `lib/db/vehicles.ts` | Domain/data helper | 322 |
| `lib/db/weekly.ts` | Domain/data helper | 35 |
| `lib/errors.ts` | Domain/data helper | 39 |
| `lib/finance.ts` | Domain/data helper | 69 |
| `lib/format.ts` | Domain/data helper | 60 |
| `lib/health.ts` | Domain/data helper | 164 |
| `lib/hooks/use-fleet-notifications.ts` | Domain/data helper | 24 |
| `lib/intelligence.ts` | Domain/data helper | 44 |
| `lib/invalidate-fleet.ts` | Domain/data helper | 7 |
| `lib/mileage-chain.ts` | Domain/data helper | 27 |
| `lib/mileage.ts` | Domain/data helper | 88 |
| `lib/periods.ts` | Domain/data helper | 44 |
| `lib/query-filters.ts` | Domain/data helper | 27 |
| `lib/rate-limit.ts` | Domain/data helper | 69 |
| `lib/reports.ts` | Domain/data helper | 51 |
| `lib/schemas/common.schema.ts` | Domain/data helper | 23 |
| `lib/schemas/mileage.schema.ts` | Domain/data helper | 18 |
| `lib/schemas/note.schema.ts` | Domain/data helper | 18 |
| `lib/schemas/transaction.schema.ts` | Domain/data helper | 57 |
| `lib/schemas/upload.schema.ts` | Domain/data helper | 30 |
| `lib/schemas/vehicle.schema.ts` | Domain/data helper | 49 |
| `lib/service.ts` | Domain/data helper | 88 |
| `lib/test-environment.ts` | Domain/data helper | 31 |
| `lib/utils.ts` | Domain/data helper | 22 |
| `middleware.ts` | Configuration | 11 |
| `next.config.js` | Configuration | 85 |
| `package-lock.json` | Configuration | 9901 |
| `package.json` | Configuration | 73 |
| `playwright.config.ts` | Configuration | 37 |
| `postcss.config.js` | Configuration | 7 |
| `prisma/migrations/20260726213709_init/migration.sql` | Migration | 112 |
| `prisma/migrations/20260728214434_init/migration.sql` | Migration | 6 |
| `prisma/migrations/20260822214326_rate_limit/migration.sql` | Migration | 12 |
| `prisma/migrations/20260823080916_add_soft_deletes/migration.sql` | Migration | 6 |
| `prisma/migrations/migration_lock.toml` | Migration | 3 |
| `prisma/schema.prisma` | Database | 140 |
| `public/favicon.svg` | Asset | 2 |
| `public/images/suzuki-spresso.jpg` | Asset | binary |
| `scripts/database/backup.sh` | Script | 28 |
| `scripts/database/restore.sh` | Script | 43 |
| `scripts/safe-exec.ts` | Script | 84 |
| `scripts/test-fixtures.ts` | Script | 38 |
| `tailwind.config.ts` | Configuration | 99 |
| `tsconfig.json` | Configuration | 24 |
| `vitest.config.mts` | Configuration | 19 |
| `vitest.integration.config.mts` | Configuration | 16 |
| `vitest.setup.ts` | Configuration | 18 |
