# Deployment

## Runtime

The application uses Next.js 14 App Router, React 18, strict TypeScript, Prisma 5, PostgreSQL, NextAuth v5 credentials authentication and Vercel Blob. The committed lockfile pins installed versions. Use the same Node.js version as CI (22) for reproducible builds.

Configure the private server environment from `.env.example`: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `BLOB_READ_WRITE_TOKEN` for attachments. `DIRECT_URL` bypasses connection pooling for migrations. Generate a strong random session secret and a bcrypt password hash. Never use `NEXT_PUBLIC_` prefixes for credentials or database/storage secrets.

Test-only variables (`APP_ENV=test`, `NITA_E2E_AUTH`, `TEST_DATABASE_URL`, `TEST_DB_APPROVED`, `TEST_DATABASE_SCHEMA`) must not be enabled on production deployments. No test setup command belongs in the Vercel build pipeline.

## Release sequence

1. Run the CI checks and review the release diff and database migrations.
2. Back up the target database with a verified restore procedure.
3. Apply committed migrations using `npm run prisma:deploy` with the intended target's direct connection. Never use `migrate reset` or a seed/import script as a release step.
4. Build with `npm run build` and deploy the verified revision to a Vercel preview environment.
5. Verify login/logout, protected routes, real-data totals, light/dark layouts, exports and test-store uploads in preview.
6. Promote only after those checks pass. Review Vercel logs for runtime/connection failures after promotion.

The package postinstall generates Prisma; the production build generates it again before Next compilation. Migration deployment is an explicit release step rather than a side effect of building.

## Storage and security

Image attachments use the existing Blob store and require upload authorization, permitted MIME type/extension and size checks. Without a Blob token, the rest of the application can run; uploads cannot succeed. The application sends anti-framing, content-type, CSP and no-index headers. Review browser console/network failures in preview when changing authentication, CSP or storage settings.

Rate limits persist in PostgreSQL. Ensure the account can read/write the RateLimit table. Deactivated vehicles retain history; analytics exclude soft-deleted transactions. Backups and restoration are operational responsibilities and are not established by a successful frontend deployment.

