# Manager accounts and approvals verification

Verified locally on 5 November 2026 using the production build, synthetic accounts, and separately generated PostgreSQL test schemas.

## Fixes

- Manager changes to vehicles, transactions, mileage and note deletions are queued for administrator review. Creating records remains immediate.
- Administrators can inspect, approve or reject requests. Managers can view only their own requests.
- Approval applies the change atomically, rejects outdated snapshots, and prevents double review. Confirmed decisions update the review card immediately.
- Disabled accounts and password resets invalidate existing manager sessions in middleware as well as route handlers, avoiding login redirect loops.
- Staff reads no longer create database tables. Load failures surface as errors instead of an empty account list.

## Checks

- TypeScript route generation and typecheck: passed.
- ESLint with zero warnings allowed: passed.
- Production build: passed.
- Unit tests: 228 passed across 19 files.
- Database integration tests: 23 passed across 11 files, including four approval integrity cases.
- Existing Chromium authentication and vehicle mutation checks: five passed.
- Manager lifecycle browser checks: passed in Chromium, Firefox and WebKit (three complete lifecycle runs).

The lifecycle check covers registration, pending-login rejection, admin activation, manager login, staff-management permission denial, submitting a vehicle edit through the form, unchanged data while pending, admin approval and rejection, transaction creation/correction, mileage correction, rejected note deletion, password-reset session revocation, old-password rejection, replacement-password login, and disabled-session rejection.

## Deployment boundary

These results verify local code and synthetic data, not existing live accounts or the live deployment. Before deployment, run the read-only staff migration preflight and follow [staff migration recovery](staff-migration-recovery.md) if runtime-created tables need reconciliation. No production migration or deployment was performed.

Email-based password recovery remains unavailable until an email delivery service is configured. Administrator password resets are covered by the lifecycle check.
