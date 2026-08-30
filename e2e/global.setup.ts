import { verifyTestEnvironment } from '../lib/db/safety';
import { prisma } from '../lib/db/client';

async function globalSetup() {
  console.log("=== PLAYWRIGHT GLOBAL SETUP ===");
  // This executes verifyTestEnvironment which checks APP_ENV, TEST_DATABASE_URL, 
  // TEST_USERNAME, TEST_PASSWORD, and validates the DB target is not production.
  
  // We're just asserting the environment is safe (requireDestructive = false for now, 
  // Playwright tests themselves might mutate though, so let's require it if E2E mutates.
  // The user said: E2E mutations must require APP_ENV=test and TEST_DATABASE_URL.
  await verifyTestEnvironment(true);

  console.log("Playwright safety checks passed. Proceeding with E2E tests.");
}

export default globalSetup;
