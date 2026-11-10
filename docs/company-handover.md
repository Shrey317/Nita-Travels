# Nita Travels company handover

## Release status

Handover is pending operational acceptance. Local tests and a successful build do not establish backup scheduling, alert delivery, or company acceptance.

The password visibility and consistent 12-character password changes must be deployed and checked on the live registration, account creation and password reset screens. Existing sign-in passwords remain valid.

Vercel builds now run a read-only migration status gate before building. A pending or failed migration blocks a release. Apply migrations explicitly to the verified target after backup; never reset production. Preview must use its own database.

## Daily user guide

1. Sign in with your assigned username/email. New registrations wait for administrator activation.
2. Check Dashboard and Alert Center for mileage and maintenance warnings.
3. Add mileage using the actual reading and its correct date. Compare it with the previous reading before submitting.
4. Record incoming driver payments as Income. Record only company-paid expenditure in company profit reports; drivers pay fuel and tickets under the current business arrangement.
5. Add supporting notes and receipts where available.
6. Managers submit corrections and deletions for approval. The original record stays unchanged until approval.
7. Review My change requests for decisions. Sign out on shared devices.

## Administrator guide

Review registrations in Users & Access. Verify the person before activation. Disable departing staff promptly. Reset passwords privately; do not send passwords in public chats. Email recovery is unavailable until a delivery service is configured.

Review Change Approvals against receipts and the original record. Approve only verified corrections. Reject stale requests and ask for a fresh correction. Concurrent decisions cannot apply a change twice.

## Company acceptance checklist

The owner and one manager should complete and sign off these tasks on a phone and laptop:

- Register, activate, sign in and sign out.
- Confirm a pending/disabled account cannot enter.
- Add a correctly dated income and expense record.
- Add mileage and request a correction; approve one request and reject another.
- Confirm unapproved changes do not alter reports.
- Reset a manager password and confirm the previous session is revoked.
- Export one week and one month; agree totals to original business records.
- Check registration Show/Hide and the same password rules in all account forms.

Use a separate acceptance database for synthetic transactions. Do not pollute the production ledger with test entries.

Record tester, date, device, result and any defect. Automated tests support this checklist but do not replace company acceptance.

## Financial acceptance

Use docs/financial_metrics.md as the calculation contract. Compare ledger income, expenses and net profit with a SQL aggregate for identical dates, then reconcile selected totals to bank/receipt records. Explain unassigned and ALLCR overhead separately.

Configuration values such as insurance premiums are not automatically ledger expenses. Purchase cost and finance principal may overlap; do not present the ownership panel as reconciled total ownership cost. Confirm driver-paid fuel/tickets are excluded from company spending.

## Backup and recovery

A one-off production backup exists at backups/approvals-before-repair.dump. It is private and excluded from Git. A one-off backup does not establish scheduled backups.

Before handover, confirm provider backup retention, recovery-point target, recovery-time target and responsible owner. Restore a backup into a separate empty database, verify staff and fleet record counts/content, and open the app against that restored database. Never test recovery by overwriting production.

The legacy restore.sh script can overwrite its target. Its use against production requires an explicitly planned recovery and verified target. Keep an off-machine protected backup; a laptop copy alone is insufficient.

## Monitoring and support

Assign an operational owner and backup contact. Configure an external availability monitor for the login page and an authenticated operational check for database-backed pages. Confirm a real alert reaches the owner. Review Vercel runtime errors after each release and investigate missing-table, authentication and connection errors.

Operational alerts go to drash1731@gmail.com through UptimeRobot monitor 804567089. Website checks run every five minutes, with Up and Down email events enabled. On 5 November 2026 the provider confirmed a test send and the owner confirmed receipt. The intended administrator recovery identity remains nitatravels.sa@gmail.com. Hosting/database provider support handles infrastructure incidents. Database-backed workflow monitoring remains pending.

## Open handover dependencies

- Deployment access: the connected Vercel account could not access this project during the last inspection.
- Gmail SMTP with Nodemailer is implemented for active manager accounts. The owner reports GMAIL_USER and GMAIL_APP_PASSWORD are configured in Vercel. Production migration, release and actual delivery verification remain pending. Administrator recovery remains deployment-managed.
- Backup schedule needs verification. The saved backup was restored into a separate local database on 5 November 2026; all saved content fingerprints matched (2 staff accounts, 9 vehicles, 401 transactions, 234 mileage entries, zero notes). Website monitoring delivery is verified; database-backed workflow monitoring remains pending.
- The company must perform acceptance and financial source-document sign-off.

Owner update, 9 November 2026: password-reset sign-in, company acceptance testing and financial reconciliation were confirmed complete. Formal final sign-off was declined. The owner chose Neon Free and explicitly accepted its six-hour recovery window. Scheduled snapshots remain unavailable under that decision; no plan upgrade is required for the agreed handover scope. Existing local backups are one-off recovery copies.

Neon backup settings inspected on 6 November 2026: production has a six-hour point-in-time history window. The Backup & Restore page reports no snapshots and no schedule set; snapshot scheduling displays Upgrade for schedules. No paid upgrade or production restore was performed.

Do not mark these complete until there is evidence of the actual operational result.

## Latest handover verification — 5 November 2026

The live registration page displays Show password and 12–72 character guidance. Local TypeScript and lint checks passed, alongside 229 unit tests. The backup recovery drill completed in nita_restore_20261105 on loopback port 55438. Production was not used as the restore target. The backup predates the approvals repair; the later migrations were successfully applied to the restored database and record fingerprints still matched afterward. The restored staff table default was reconciled to the committed migration schema.

Run scripts/verify-local-recovery.cjs with RECOVERY_DATABASE_URL pointing to the named local recovery database to repeat the content comparison. It prints counts and pass/fail results, not account credentials or ledger contents.

Company acceptance and financial source-document reconciliation require the owner's sign-off.

The current local integration run passed all 23 tests across 11 files, including SQL-backed financial summaries, weekly calculations, mileage integrity, migration preservation and atomic approvals. This verifies calculation behavior; it does not certify the completeness or accuracy of business source entries.
