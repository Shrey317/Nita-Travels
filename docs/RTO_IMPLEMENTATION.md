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

## RTO interface simplification

Removed Service & Repairs planning and Scheduled Servicing navigation entries, and the RTO service task tab. Existing stored records and backend services are retained. The RTO dashboard now shows three daily actions, four summary figures, a six-column vehicle/driver register and collapsed charts/exports. Agreement task pages show only relevant summary figures, with a short overview action panel. Registers use a labelled agreement selector. This is an interface-only update; no live data migration is required.

Simplified-interface verification: production build (including lint and TypeScript) and all three Chromium workflows passed, covering the vehicle picker, focused forms, module navigation, privacy and mobile layout.

## Manual entries and direct car creation

RTO Vehicles now has an Add car button and dedicated /rent-to-own/vehicles/new form. Successful creation returns to the vehicle register; no driver or agreement is required at this stage. The Payments register opens the Manual entry agreement tab, where the administrator explicitly records actual receipts, repair invoices and completed services. The manual repair route does not require a quotation workflow and does not invent a quotation or payment. Expenses and driver receipts remain separate records. Expected weekly rent remains a schedule, never automatically collected income. Service planning remains absent from navigation.

Manual-entry verification: production build passed, 12 isolated database tests passed and all 4 Chromium workflows passed. Browser verification creates a car using the actual form and checks payment, repair and completed-service entry forms without service planning.


## Weekly deposit change — 14 November 2026

The user confirmed R650 deposit instalments start with the first weekly rent payment, apply to existing agreements, and preserve prior deposits. For an R8,000 deposit with no prior payments this is 12 × R650 and one R200 payment. No full deposit is required to start; the signed agreement is still required. The deposit follows rent due dates, including downtime extensions. Existing UPFRONT receipts count toward the deposit without rewriting the original records or signed terms.

The Add payment form combines rent and deposit into one WEEKLY receipt. The server locks the agreement, checks the full amount for the selected oldest unpaid weeks, allocates rent and stores the deposit portion separately. Short payments are rejected; late payments can cover multiple weeks. Duplicate retries cannot create a second receipt. Undoing the receipt restores both rent and deposit balances. Completion requires the full deposit. Deposit-only payments cannot exceed the remaining deposit.

Rent charts exclude deposits. Outstanding totals include only deposit instalments due by the report cutoff; future deposit amounts are not labelled overdue. Payment lists and CSV exports show the rent/deposit split. The main menu shows daily work first, with less-used pages under More. The payment form calculates the total when Weeks paid changes.

Migration 20261114090000_weekly_deposit adds the WEEKLY enum value and a nonnegative depositAmount column (default zero) with an amount cap. It does not alter or delete previous receipts. Apply it before deploying this code. Old app versions can continue serving old receipts during migration, but once WEEKLY receipts exist, rollback must retain a reader that understands WEEKLY and depositAmount. Do not drop the new column or rewrite receipts to roll back.

The weekly-deposit migration and app changes have not been applied to production in this task.

Prior standalone deposits reduce the remaining total to collect; the weekly top-up stays R650 until the final smaller payment. For example, an existing R1,000 deposit leaves ten R650 payments and one R500 payment.

Final verification (15 November 2026): production build, lint and TypeScript passed; 257 unit tests passed; 17 isolated database tests passed during implementation, with the four weekly-deposit tests rerun after the compatibility adjustment. All five Chromium workflows passed against the final build, including combined payment receipt, manual car creation, mobile navigation and bank privacy. Car selection uses a same-origin relative redirect; successful car creation navigates without a competing refresh. Vercel team access remains blocked (403); production migration and deployment remain pending.
