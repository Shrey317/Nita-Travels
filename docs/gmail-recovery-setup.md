# Gmail password recovery setup

Use Nodemailer with Gmail SMTP. No custom sending domain is required.

Password-reset sender: drash1731@gmail.com, confirmed by the owner on 6 November 2026. Operational alerts also use drash1731@gmail.com. The administrator recovery identity remains separate.

The owner must enable Google 2-Step Verification and create an app password if the account permits it. Configure the following directly in Vercel's encrypted production environment settings; never paste credentials into chat:

- GMAIL_USER: drash1731@gmail.com
- GMAIL_APP_PASSWORD: the account's app password, not its normal sign-in password
- AUTH_URL / NEXTAUTH_URL: the verified public application origin

Use Gmail's SMTP transport with authenticated TLS. Do not enable SMTP debug logging or expose credentials through NEXT_PUBLIC variables.

The owner reports both Gmail variables are saved in Vercel. The manager recovery workflow is implemented with Nodemailer, one-use hashed tokens, 15-minute expiry, rate limiting and session revocation. Local validation is recorded in the handover notes. Production migration, deployment and real Gmail delivery verification are still required before calling recovery operational. The environment-configured administrator remains outside this flow and uses deployment credential recovery.

References:
- https://nodemailer.com/guides/using-gmail
- https://support.google.com/accounts/answer/185833

## Local release verification — 6 November 2026

Passed: production build, TypeScript, ESLint, 232 unit tests, 26 integration tests, Chromium reset-form test, reproducible npm install dry run and production dependency audit (zero vulnerabilities). Nodemailer is pinned to patched version 10.3.1.

The browser test verifies expired-link rejection, password update, session-version increment, URL fragment removal and replay rejection. Database tests also verify concurrent use, invalidated earlier links and disabled-account rejection. SMTP tests use a mocked transport; actual Gmail delivery has not been verified.

Release sequence: back up the intended production database, apply 20261106090000_password_resets with prisma migrate deploy, release the verified code, request a link for an active email-based manager account and confirm receipt. The account holder should complete their own password entry and confirm the new sign-in works.

Production migration completed on 6 November 2026 at the owner's request. Only the password-reset migration was pending. A fresh private backup was created and its archive verified before deployment. PasswordReset is queryable, and existing staff, vehicle, transaction, mileage and note fingerprints match their pre-migration values. The owner is handling application deployment; real Gmail delivery remains unverified.
