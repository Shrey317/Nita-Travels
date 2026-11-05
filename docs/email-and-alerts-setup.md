# Email and operational alerts setup

Operational alert recipient: drash1731@gmail.com.
Intended administrator recovery identity: nitatravels.sa@gmail.com.

These addresses serve different purposes. Changing the alert recipient does not change an account's login or recovery identity.

## Hosting connection

Connect the Vercel account/team that owns nita-travels in the Codex Vercel app connection settings. The current connection returns no teams and previously could not resolve the project. After reconnecting, verify project ownership before changing settings or releasing code.

## Transactional email provider

Prepare a Resend account with a company-controlled sending domain. Add the DNS verification records supplied by Resend at the domain's DNS provider. Use a sender such as accounts@your-verified-domain; the Gmail inbox is a recipient, not proof of ownership of a sending domain.

Create a sending API key in the provider dashboard and enter it directly in Vercel's encrypted environment settings. Never paste it into chat or commit it. Restrict access to the intended project/environment.

The provider's test sender is suitable only for limited verification; it does not establish general manager password recovery. Production recovery requires a verified sender and delivery testing to actual intended recipients.

## Recovery implementation acceptance

Provider configuration alone does not implement recovery. Before enabling a Forgot password screen:

- Use short-lived, one-use reset tokens stored as hashes.
- Return the same public response for known and unknown accounts.
- Rate-limit requests and token attempts.
- Use the configured public site origin for reset URLs.
- Apply the shared password validation policy.
- Consume tokens atomically and revoke existing sessions after a successful reset.
- Test expiry, replay, invalid tokens and delivery failures.
- Handle the environment-configured administrator separately: its password currently comes from deployment configuration rather than StaffAccount.

Keep existing administrator-assisted manager resets available until this flow is implemented and verified.

## Operational alerts

Configure hosting error notifications and an external availability monitor to deliver to drash1731@gmail.com. Start with the public login page. A successful login-page check does not verify database-backed pages; add an authenticated or suitably protected database readiness check.

Trigger a controlled monitor test notification and confirm receipt before marking monitoring complete. Record provider, monitored URL, check interval, escalation contact, and last delivery verification date. Avoid sending ledger data, credentials or reset tokens in operational alerts.

## Current status

Verified on 5 November 2026: UptimeRobot monitor 804567089 actively checks https://nita-travels.vercel.app every five minutes. The attached account email is drash1731@gmail.com with Up and Down events enabled. UptimeRobot confirmed a test notification was sent, and the owner confirmed receipt.

This verifies website availability monitoring and email delivery. It does not verify signed-in database workflows or application error detection.

Prepared: transactional email setup procedure.
Pending: transactional email provider account/domain verification, credentials configured directly by the owner, and recovery implementation. The Vercel connector remains unavailable; the signed-in browser provides project access.
