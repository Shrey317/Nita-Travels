import { defineConfig, devices } from '@playwright/test';
import { assertTestEnvironment } from './lib/test-environment';

assertTestEnvironment(process.env, true);
if (process.env.NITA_E2E_AUTH !== 'true') throw new Error('Launch E2E with npm run test:e2e.');

export default defineConfig({
  globalSetup: require.resolve('./e2e/global.setup'),
  testDir: './e2e',
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
