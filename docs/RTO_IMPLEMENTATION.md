# RTO and private bank finance implementation

## Delivered surfaces

- `/rent-to-own`: period-filtered operational dashboard, search/status/sort/pagination, weekly/monthly collections, expected vs collected, outstanding obligations, repair costs, progress distribution and vehicle agreement charts. Accessible chart tables and CSV exports for agreements, payments, mileage and repairs.
- `/rent-to-own/manage`: driver register, draft agreement creation and atomic vehicle handovers/transfers.
- `/rent-to-own/agreements/[id]`: activation and lifecycle, immutable contractual terms, 234-week standard schedule, upfront payments, oldest-first rental/charge allocations, unapplied credits, reversals, approved obligation adjustments, weekly mileage and latest-reading corrections, repairs, completed services, downtime, settlement review, private documents and audit history.
- `/bank-finance` and `/bank-finance/[id]`: administrator-only finance agreements, actual payment components, statement snapshots, dated settlement quotations, refinancing/settled status, reconciliation adjustments, weekly, fortnightly, monthly or quarterly contractual cash schedules, charts, private ledger exports and evidence downloads.
- Existing vehicle profiles link to the separate histories and show transfer/handover records. Normal Rental monetary columns and historical source rows are preserved.

## Financial definitions and controls

Legacy financial values remain integer cents. New amounts use PostgreSQL Decimal(14,2), decimal calculations and string API values. Presentation charts convert to numbers only for plotting.

An obligation is due after seven chargeable days. The default 234-week schedule is generated on activation, after signed-document and upfront-payment checks. Standard terms and the selected contractual amounts cannot be edited through the API after creation. Rent, upfront and ancillary-charge payments are separate purposes. Payments allocate oldest first within their purpose; excess remains an unapplied credit, never invented rental income in the Normal Rental ledger. References and idempotency keys prevent duplicate payments. Reversal retains payment/allocation records and removes their financial effect. Obligation and latest-mileage corrections preserve before/after values and reasons in audit events.

Downtime intervals are half-open, cannot overlap, and pause the chargeable clock at timestamp precision. Open intervals are evaluated at read time. Closing downtime persists revised dates. Progress measures elapsed chargeable weeks, not legal title. Completion requires elapsed duration, paid obligations and closed downtime; early settlement review alone never transfers title or automatically completes a contract.

Bank cash paid, known principal components, latest verified outstanding principal and dated settlement quote are distinct. Unknown principal components remain unknown. Bank adjustments are reconciliation records, not automatic changes to statement balances. A frequency-based bank cash schedule is available only when the first contractual due date is recorded; oldest-first cash allocation for this schedule is not a principal repayment calculation. Statement arrears remain the verified bank position.

## Access and attachments

Approved staff may read RTO pages. New RTO mutations and all bank-finance reads/writes require ADMIN on the backend. No new finance role was introduced into the existing ADMIN/MANAGER authentication system. Bank data is not fetched for unauthorised operational components. Private files are stored as database bytes and downloaded through authenticated, no-store endpoints, never public Blob URLs. PDF/JPEG/PNG signatures are checked; maximum file size is 2 MB. Documents are attached at agreement level and can identify the corresponding payment/statement in their filename.

## Migration and release

Migration `20261111120000_rto_bank_finance` adds dedicated tables and initial rental assignments, restrictive foreign keys, positive-money/reconciliation checks and unique open-assignment/operational-agreement indexes. It does not convert or delete existing ledger records. Transfers and financial mutations use database row locks and atomic transactions. Normal Rental transaction/mileage/work-order writes validate the operating module for the record date. Handover readings provide odometer anchors without copying RTO distance into rental history.

Before production: verified backup, staging migration and acceptance, then explicit production migration before application deployment. Build/release checks do not apply migrations. Roll back application code while retaining all additive tables and records. No production migration or deployment has been performed by this implementation.

## Additional operational workflows

Migration `20261112090000_fleet_reconciliation` adds physical availability, replacement reservations, meter replacement continuity, reviewed weekly mileage periods and bank payment frequency. Migration `20261112100000_rto_repair_approvals` adds repair approval stages and planned services. All three expansion migrations are additive.

Meter replacement records retain displayed and lifetime kilometres with an explicit offset. Irregular mileage remains unbilled until verified weekly distances reconcile to boundary and intermediate readings. Weekly allowances never roll over. Corrections update displayed and lifetime readings together and cannot silently invalidate reviewed allocations.

Downtime reserves an available unassigned replacement, prevents overlapping reservations, releases it on return and supports audited closed-interval corrections. Physical availability is independent of operating module. Repairs progress from quotation through approval, capped invoice and company-contribution payment; driver charges are created once after recoveries. Planned services do not change physical mileage or incur costs until completion. Central notifications include RTO service, missing/review mileage and open downtime.

Legacy financing fields are also protected: manager vehicle responses, forms and approval snapshots are redacted, and manager financial mutations are rejected. Operational edits remain available through the existing approval flow. Legacy instalment estimates are labelled as estimates and never imply a verified bank balance or legal ownership.

Reports distinguish selected-period outstanding rent from all obligations due by the reporting cutoff. Bank statements, settlement quotations and subsequent reconciliation adjustments remain separate evidence.

## Remaining scope / release limitations

This implementation is not a complete production sign-off against every item in the master brief:

- Direct mileage correction supports the latest reading. Historical corrections and changes to reviewed weekly allocations still need a dedicated adjustment workflow. Partial weeks require boundary evidence; distances are never guessed or prorated.
- Settlement reviews record pending or approved figures and their basis, but do not execute negotiated refunds or legal ownership transfer. Approved contract generation and enforcement require supplied legally reviewed templates and rules.
- Repair company payments are recorded per repair; a general workshop accounts-payable ledger is not included.
- New-module mutations remain administrator-only; manager requests are not yet routed through ChangeRequest.
- Large-register scaling needs bounded aggregate queries and database pagination; current dashboard pagination follows loading matching agreements. Evidence is agreement-linked rather than individually linked to every payment/statement.
- A dedicated finance-personnel role, bank-reference field encryption, malware scanning and document retention controls are not included.

## Verification record

- Prisma validation and TypeScript checks passed; production build and browser results are recorded below.
- Unit suite: 252 passed with one authentication hook timeout during a long execution pause; the focused authentication rerun passed all 13 tests. The earlier complete run passed all 253 tests across 26 files.
- Latest isolated PostgreSQL run: 10 RTO/bank workflow tests and one migration-preservation test passed with all 13 migrations. Earlier targeted approvals, operations, notification and mileage regression suites passed.
- Tests use a workspace-local PostgreSQL cluster on loopback port 55439 with synthetic data and a separate schema per integration file. No application or production database was migrated or seeded.

- Final production build passed, including lint and TypeScript checks; static-page generation recovered on retry after an execution pause.
- Final Chromium verification: both tests passed (contract upload/activation, rent allocation, responsive dashboard, private bank views/export, and manager restrictions across API, edit forms and approval snapshots).
- Working-tree whitespace validation passed (Git emitted only line-ending conversion notices).

## Live demo data — 12 November 2026

At the user's explicit request, the configured live database was backed up to the ignored backups directory and all three expansion migrations were applied successfully. The repeat-safe script scripts/seed-rto-demo.ts adds only DEMO-RTO-01 through DEMO-RTO-03, with fictional drivers and payments. These fixtures intentionally have no signed legal contracts. Demo figures appear in operational totals until the demo records are removed. Deployment visibility requires separate Vercel verification.


## Business-system navigation — 12 November 2026

The top navigation switches between Normal Rental and Rent-to-Own. Routes determine the active system, including on refresh and direct links. The sidebar and mobile shortcuts show only that system's operations. Bank finance remains shared and administrator-only.

Rent-to-Own has dedicated vehicle, agreement/driver, payment, mileage, repair, service, downtime/replacement, document, settlement, alert and report registers. Registers use database pagination (30 rows per page) and agreement search. Choosing an agreement opens the corresponding focused task tab, including the existing mutation workflows. New vehicles can be registered directly into RTO without creating a Normal Rental assignment.

Normal Rental active lists, service status and entry selectors exclude vehicles assigned to another system. Rental historical analytics retain vehicles that previously operated in Normal Rental, preserving their legitimate earlier ledger history; RTO-only vehicles are excluded. Search, notification badges and alert views follow the selected system. No financial records are copied between systems.

The new navigation and page changes have not been deployed; Vercel team access is still required.

Verification for business-system separation: production build, lint and TypeScript passed; 253 unit tests, 11 isolated PostgreSQL integration tests and 3 Chromium workflows passed. Browser coverage includes all eleven RTO registers, focused repair forms, desktop/mobile switching, manager bank privacy and exclusion from the Normal Rental vehicle API.
