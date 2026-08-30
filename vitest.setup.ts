import { beforeAll } from "vitest";
import { verifyTestEnvironment } from "./lib/db/safety";

beforeAll(async () => {
  // Unit tests do not load this file (they are separate), or we only include this setup for integration tests.
  // Actually, we should check if we are running destructive integration tests.
  // The vitest config needs to load this setup file.
  
  if (process.env.APP_ENV !== "test") {
    throw new Error("vitest.setup.ts: APP_ENV=test is required for integration tests.");
  }
  
  // We'll require destructive mode if integration tests mutate the DB.
  // The user said: "Read-only integration tests: APP_ENV=test + valid TEST_DATABASE_URL. Destructive integration tests: APP_ENV=test + valid TEST_DATABASE_URL + explicit ALLOW_DESTRUCTIVE_TEST_DB=true."
  // Since our tests will mutate, we require destructive permissions.
  await verifyTestEnvironment(true);
});
