# Interface modernization and codebase cleanup

4 October 2026. This work updates the existing fleet application and preserves its database schema and business records.

## Daily workflows

- Financial results now precede operational detail on the dashboard. Fleet counts share a compact status strip, net profit has a distinct surface, and the three highest-priority alerts link to the full alert center.
- Reporting controls, distance efficiency, fleet performance and maintenance use keyboard-operable native disclosures. Financial charts and alerts sit alongside one another on desktop.
- Mobile navigation provides direct access to the overview, vehicles, mileage and entry creation. Transaction cards expose amounts, notes, edit/delete controls and every desktop sort order. Fleet performance uses cards on small screens.
- Larger controls, stronger secondary-text contrast, keyboard-scrollable tables, safe-area spacing and reduced-motion support improve accessibility. The offline notice explains when saving requires reconnection.
- Analytics filters provide pending feedback, reset links, date-order validation and correctly restored controls after Back/Forward navigation.
- Transaction submission tolerates blocked browser storage. A preference-write failure no longer misreports a successful save as a network failure.
- Sign-in displays progress and prevents duplicate submissions while authentication is pending.

The reviewed dashboard screenshots measure 1,816 px at a 1,440 px desktop width and 2,928 px at a 390 px mobile width. The earlier expanded layout measured approximately 3,020 / 5,567 px respectively. These are layout measurements with synthetic fixtures, not load-time benchmarks.

## Reliability and dependencies

Next.js 14.2.35 → 15.5.27; React 18 → 19.3; NextAuth beta.20 → beta.32; Vercel Blob 0.23 → 2.8. Request parameters were migrated with the official codemod and reviewed. Middleware uses the supported Node.js runtime for the updated authentication library.

The upload adapter follows Blob 2's token format. The callback address is chosen by the server, and completion payloads retain their original bytes/order for SDK signature verification. File type, size and session checks remain enforced. The content security policy permits the SDK's specific `https://vercel.com/api/blob/` transport path.

PostCSS is pinned to a patched compatible version throughout the dependency tree. Vitest/Vite and TypeScript ESLint were updated; test configs use ESM and lint runs through the ESLint CLI. Route types are generated before type checking on clean checkouts.

Navigation and notification counts share a SWR request. Dashboard service reads are reused in notification calculations. Financial calculations continue to use the shared integer-cent reporting path.

Login attempt storage failures now deny authentication temporarily and log a generic message. Successful-login cleanup tolerates a missing rate-limit record.

The production dependency audit reports **zero known vulnerabilities**. The full development-tool audit retains **seven high-severity findings** originating from the `braces` dependency in Tailwind 3 / ESLint glob tooling. No unsupported dependency substitution was introduced to suppress those findings. This is not a penetration-test certification.

## Structure and recovery

- Removed ten unreferenced legacy UI components after checking imports.
- Moved the weekly database test into `__tests__/integration` and simplified discovery.
- Moved backup/restore tooling into `scripts/database`. Backups go to ignored `backups/`; restores stop on errors within a single SQL transaction.
- Moved earlier UI audits into `docs/history`.
- Removed obsolete import, seed, repair, scratch and snapshot files from the application tree. Recovery copies remain in ignored `.local-archive`. The most recent CSV-import backup remains in `.local-import`.
- Untracked generated test reports and TypeScript cache; added editor settings, a Node version file and deployment exclusions for local recovery material.
- Updated README, architecture, deployment and testing guidance to reflect the current layout.

## Verification and limits

Browser tests use disposable local PostgreSQL schemas and synthetic fixtures; no production mutations are performed by the suites.

| Check | Result |
| --- | --- |
| Production build | Passed on Next.js 15.5.27; 102 kB shared first-load JavaScript |
| TypeScript and lint | Passed; route types generated successfully and zero lint warnings |
| Unit tests | 194 passed across 12 files |
| Database integration | 11 passed across 5 files |
| Full browser run | 50 passed; one test synchronization failure investigated and corrected |
| Final targeted browser run | 5 passed, including mileage restoration, transaction deletion, desktop/mobile sorting and both responsive transaction themes |
| Responsive coverage | All 15 routes passed in both themes at 320, 375, 390, 430, 768 and 1,440 px; no document overflow or application console/500 errors |
| Production dependency audit | 0 known vulnerabilities |

The first cold-development-server login needed a 30-second navigation allowance. The later mileage failure came from an accessibility-role locator disappearing while a modal was open, before the DELETE completed. The test now awaits the successful DELETE response, dialog closure and actual DOM row removal before reading the odometer. The final rerun confirmed restoration to the fixture's 30,000 km baseline. No mileage business-logic change was required. The browser suite now has 52 distinct tests; the entire suite was not rerun after the final small sort-selector fix, which was covered by the focused run.

Local verification used Node.js 26.1.0 on Windows. The repository and CI recommend Node 22; that CI job was configured but was not dispatched in this pass.

Screenshots were reviewed for desktop/mobile and light/dark presentation. Full-run evidence is retained locally under `.local-archive/verification/modernization-run-2`; the latest focused report is in `playwright-report`. All temporary test schemas were confirmed removed, and the local test database service was stopped.

The application has not been deployed in this pass. Actual Vercel Blob delivery requires a configured test store and remains a provider acceptance check. Private document storage, multiple user roles and formal WCAG certification are outside the implemented single-admin product. Historical source-data omissions remain visible in Data Quality.

## Upgrade references

- [Next.js 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js 15.5 middleware and lint changes](https://nextjs.org/blog/next-15-5)

