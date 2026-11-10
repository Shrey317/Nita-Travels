# Monitoring, administrator recovery and operations release

## Implemented

- /api/ready verifies the required database tables and columns using read-only queries, returns only readiness status, and requires a dedicated Bearer credential of at least 32 characters.
- Sentry captures unhandled server requests, unexpected API failures and client error boundaries when DSNs are configured. Its event filter removes request/user data, breadcrumbs, extra payloads and raw exception messages. Stack frame URLs omit queries/fragments. Tracing and replay are not enabled.
- /api/monitoring-test allows an administrator to dispatch a controlled event and confirm receipt in Sentry. It is rate-limited and does not expose an unauthenticated error trigger.
- Administrator recovery setup copies the existing configured hash into AdministratorCredential and sends verification to nitatravels.sa@gmail.com. Until email verification, the existing credential path remains in use. Once verified, authentication uses the database credential and version, and the old environment hash no longer overrides it. Email reset uses the same expiry/replay protection as manager recovery. A reset revokes old admin sessions.
- Document register supports vehicle, type, reference, expiry, edits and archiving. Expiring documents appear in Alert Center within 30 days.
- Service and repair planning supports dates, workshop, target odometer, actual start/completion, notes and a link to a recorded expense. Linking work does not create another financial transaction.
- Actual downtime is reported per job as elapsed calendar days. Same-day work is zero days. Ongoing work uses the current Johannesburg calendar date. Overlapping jobs are not summed into a fleet total.
- Manager edits, completion changes and archive requests stay pending until an administrator approves them. Archived records are retained.

## Release configuration

Configure MONITORING_SECRET directly in encrypted Vercel settings and use the same value as a Bearer Authorization header in the external readiness monitor. Do not put the secret into a URL or a NEXT_PUBLIC variable. Monitor /api/ready for HTTP 200; a 401 is a configuration failure, not successful readiness.

The existing UptimeRobot Free monitor remains useful for website availability. Its documented custom-header capability may require a paid plan. Verify the current account's available settings before claiming that it checks the protected readiness endpoint. If headers are unavailable, use a separate free monitor that supports an Authorization header; do not expose the secret in a URL or remove endpoint protection as a workaround.

Configure SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN for the intended Sentry project. The public DSN is an ingestion identifier, not an administrative API key. No source-map upload token is required for this initial setup. Verify that an issue alert targets drash1731@gmail.com, then send a controlled event and confirm actual receipt before declaring error alerts operational.

Back up production before applying:

1. 20261109090000_work_order_planning
2. 20261109100000_administrator_recovery

Apply migrations before releasing the corresponding code. Do not reset or seed production.

## Administrator activation

After deployment, sign in as administrator and open Admin Recovery. Request verification and complete the link in the owner's inbox. Verification requires an explicit button press, so an email scanner cannot activate it by loading the URL. Expect to sign in again after activation. Keep the existing password until testing a reset deliberately.

Verify normal administrator sign-in, recovery delivery, a completed reset and rejection of older sessions. The owner must enter the new password themselves.

## Operational use

Use Document Register for expiry dates and renewal corrections. Use Service & Repairs to schedule work. Start dates mean the vehicle is unavailable; completion means it returned to service. Planned dates can be future dates; actual dates cannot. Select a recorded expense for the same vehicle instead of entering the cost again.

The expense picker shows the latest 200 qualifying transactions. Earlier linked expenses remain preserved. Use the vehicle filter and register pagination to find history. Full attachment upload and aggregate downtime charts are outside this release.

## Live verification still required

Production migrations were applied on 9 November 2026 after a fresh logical backup. Existing record counts and fingerprints were unchanged. The backup and comparison manifest are retained in the ignored backups directory.

The nita-travels Sentry project was created, SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN saved for Vercel Production, and the issue alert configured to notify drash1731@gmail.com for new issues as well as high-priority issues. The Sentry uptime monitor form is prepared for /api/ready with an Authorization header; its private value still requires owner entry. No paid upgrade was selected.

Validation: 240 unit tests, 30 database integration tests, lint, TypeScript checks and the final production build passed. Six focused browser checks passed across Chromium, Firefox and WebKit for administrator verification/reset/sign-in/session revocation and manager document/repair approvals.

Still required: owner entry of MONITORING_SECRET and the matching monitor header, production code deployment, successful external readiness checks, actual Sentry event/email receipt and owner inbox verification for administrator recovery. Use the administrator Monitoring page to dispatch a test event after deployment. These are activation checks, so this release is not yet fully operational in production.
