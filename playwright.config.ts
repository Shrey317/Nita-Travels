import { defineConfig, devices } from '@playwright/test';
import { verifyTestEnvironment } from './lib/db/safety';
import { prisma } from './lib/db/client';

if (process.env.APP_ENV !== 'test') {
  console.error("CRITICAL: APP_ENV=test is required for Playwright tests.");
  process.exit(1);
}

if (!process.env.TEST_DATABASE_URL) {
  console.error("CRITICAL: TEST_DATABASE_URL is required for Playwright tests.");
  process.exit(1);
}

// Will throw an error and stop execution if safety checks fail.
// Wrap in a self-executing async function since Playwright config isn't typically async at the top level,
// but wait, we can just top-level await in modern Node if type module is set, or we can just let it run synchronously? 
// No, top-level await might fail in commonjs. We'll perform the sync checks here and the async DB checks in globalSetup.

if (process.env.BASE_URL && /prod|nita-travels|production/i.test(process.env.BASE_URL)) {
  console.error("CRITICAL: Playwright cannot target a production environment.");
  process.exit(1);
}

// Inject standard test environment variables
process.env.PLAYWRIGHT_TEST = 'true';

export default defineConfig({
  globalSetup: require.resolve('./e2e/global.setup'),
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
