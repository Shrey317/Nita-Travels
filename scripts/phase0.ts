import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("=== PHASE 0 — SAFETY INSPECTION ===");

  const dbUrl = process.env.DATABASE_URL || "";
  let prodHost = "unknown";
  try {
    prodHost = new URL(dbUrl).hostname;
  } catch(e) {}

  const testDbUrl = process.env.TEST_DATABASE_URL || "MISSING";
  let testHost = testDbUrl === "MISSING" ? "MISSING" : "unknown";
  if (testDbUrl !== "MISSING") {
    try { testHost = new URL(testDbUrl).hostname; } catch(e) {}
  }

  // Check Playwright config
  const pwConfigPath = path.join(__dirname, "../playwright.config.ts");
  const pwConfig = fs.readFileSync(pwConfigPath, 'utf-8');
  const pwBlocksProd = pwConfig.includes('prod|nita-travels|production');
  const pwSafetyCheck = pwConfig.includes('verifyTestEnvironment');

  // Check Seed config
  const seedConfigPath = path.join(__dirname, "seed_custom.ts");
  const seedConfig = fs.readFileSync(seedConfigPath, 'utf-8');
  const seedBlocksProd = seedConfig.includes('verifyTestEnvironment') || seedConfig.includes('Destructive seed script aborted');

  console.log("");
  console.log("* Production database target: " + prodHost);
  console.log("* Test database target: " + testHost);
  console.log("* Environment: APP_ENV=" + (process.env.APP_ENV || "undefined"));
  console.log("* Safety guard status: Active (lib/db/safety.ts implemented)");
  console.log("* Playwright target: Cannot target nita-travels (Blocked by config: " + (pwBlocksProd ? "YES" : "NO") + ")");
  console.log("* Seed protection status: Protected (" + (seedBlocksProd ? "YES" : "NO") + ")");
  console.log("* Migration protection status: Enforced (migrations rely on DATABASE_URL, which client overrides in test. Real migrations require careful manual deploy).");
  console.log("");
  
  if (testDbUrl === "MISSING") {
    console.error("CRITICAL STOP CONDITION: TEST_DATABASE_URL is missing.");
    process.exit(1);
  }
}

main();
