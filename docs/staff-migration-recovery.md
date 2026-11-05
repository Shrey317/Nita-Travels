# Staff account migration preflight

Before deployment, back up the database using the existing backup procedure and run:

```sh
npx tsx scripts/check-staff-migration.ts
npx prisma migrate status
```

These checks are read-only. The application no longer creates StaffAccount during requests, and database failures now fail visibly instead of appearing as an empty staff list.

If the table is absent, apply the normal migrations before starting the application.
If the staff migration is already recorded, continue with normal migration deployment.

## Table created by the previous runtime code

Do not drop the table, delete accounts, reset the database, or edit an already released migration.
Pause deployment if the preflight reports an existing table without a completed migration.
Inspect the existing schema against `prisma/migrations/20261030090000_staff_accounts/migration.sql`: all eight columns, NOT NULL constraints, defaults, timestamp precision 3, primary key on id, unique email index, and validated status check allowing only PENDING, ACTIVE and DISABLED.

The old runtime code added one extra default on updatedAt. After a backup and verification, remove that default with a schema-qualified ALTER TABLE for the intended application schema:

```sql
ALTER TABLE "public"."StaffAccount" ALTER COLUMN "updatedAt" DROP DEFAULT;
```

Replace public only if the configured application schema differs. This changes no existing account values.
Verify row count and account identifiers before and after; do not print password hashes.

Only after confirming the existing table is equivalent to the migration, record it as already applied:

```sh
npx prisma migrate resolve --applied 20261030090000_staff_accounts
npx prisma migrate deploy
npx tsx scripts/check-staff-migration.ts
npx prisma migrate status
```

If the schema differs in any other way, stop and reconcile that specific difference before baselining. The preflight is an initial guard, not automatic permission to mark arbitrary schema drift as applied. These recovery commands have not been run against production as part of local verification.
