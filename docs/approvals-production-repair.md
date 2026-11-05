# Change Approvals production repair — 5 November 2026

The live /approvals page showed the generic error boundary because the configured production database had no ChangeRequest table. Only the first four migrations were recorded. StaffAccount had previously been created by runtime code, so blindly deploying migrations would have failed on that existing table.

## Repair performed

1. Inspected table columns, defaults, timestamp precision, primary key, unique email index and validated status constraint against the staff migration.
2. Created a custom-format PostgreSQL public-schema backup in the git-ignored backups directory and verified its archive listing.
3. Recorded counts and content fingerprints for StaffAccount, Vehicle, Transaction, MileageEntry and VehicleNote.
4. Removed the runtime-only updatedAt default from StaffAccount, without changing account values.
5. Recorded the verified equivalent staff migration as applied using Prisma migrate resolve.
6. Applied the remaining committed migrations using Prisma migrate deploy. The finance backfill affected zero vehicle classifications.
7. Verified that all seven migrations completed and that all five existing-data fingerprints remained identical.
8. Signed into the live application and opened Change Approvals. The heading and genuine empty state rendered successfully.

The approvals table contains zero requests. No test approval requests or fleet records were inserted into production. No application redeployment was needed.

Before future schema-dependent releases, run the migration preflight and apply migrations before serving the corresponding application code. A passing local build alone does not verify the production database schema.

Backup: backups/approvals-before-repair.dump. This file contains private application data; retain it outside version control.
