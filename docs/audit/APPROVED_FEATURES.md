# Approved feature implementation

Private internal system for the owner and managers. No rentals, weekly debt tracking, proportional payment calculation, period locking or private attachment delivery in this scope.

## Implemented locally

- Mileage entry review: confirm vehicle, full date, previous/current readings and distance; return to correct fields before saving. Numeric mobile keyboard.
- Saved filter/report views: named views for supported existing pages, retained on the current browser/device. Fixed dates; pagination and record-edit parameters omitted. No financial records are stored in browser preferences.

## Remaining implementation

Account foundation in progress: public pending-manager registration, hashed passwords, normalized email identities, registration throttling, owner-only request list, role-bearing sessions and disabled-account checks. Additive StaffAccount migration is authored but has not been applied to production. Account activation and change approval are not implemented; manager PATCH/PUT/DELETE is denied as an interim safeguard. This foundation is not release-ready.

Further in-progress work: additive ChangeRequest, FleetDocument and WorkOrder models/migration; document/work-order schemas; shared approval service with record snapshots, stale-state detection and atomic decision/application; optional transaction clients in existing vehicle, transaction and mileage mutation helpers. Mileage helper accepts date corrections and recomputes week/year and chain. The new service is NOT wired to API routes or UI yet. TypeScript and 215 existing unit tests pass; new migration/integration/browser proof still required. Helper agent encountered account usage limit during this batch; no production migration/deployment occurred.

Verification of the UI slice: production build (including lint/type checking) passed; vehicle/mileage browser workflows passed (2 tests). Saved-view navigation initially failed intermittently with client-router buttons; native links passed three consecutive browser runs. No production deployment performed.

1. Database-backed accounts: self-registration as pending manager; admin approval required before access. Preserve existing administrator login during migration. Owner recovery address: nitatravels.sa@gmail.com.
2. Authorization: approved managers can read finance and create records. All edits, deletions and deactivations must submit a pending request without modifying the original. Admin review shows before/proposed values; reject stale requests after concurrent changes. Revalidate constraints and apply the decision atomically with audit history. Enforce in every server mutation, not only UI controls.
3. Password recovery: expiring, single-use hashed tokens; generic responses; rate limiting; revoke sessions after reset. Email delivery remains disabled until a sending service is configured. No reset links in logs or unauthenticated responses.
4. Document register: vehicle, document type, reference, expiry date, existing attachment storage and expiry views.
5. Repairs: explicit start/completion dates and actual recorded downtime; preserve existing historical expense records without guessing dates.
6. Service scheduling: planned service dates, vehicle and task status, with in-app reminders reusing existing service rules.
7. Mileage date corrections through the same approval mechanism, preserving full-chain validation.

## Release gates

Additive schema migration only; no historical rewrite. Exercise pending/disabled access, every manager mutation route, stale approvals, duplicate decisions and session revocation with synthetic fixtures. Verify mobile forms and end-to-end approvals. No deployment until checks pass. Current local UI work does not mean accounts or approvals are implemented.
