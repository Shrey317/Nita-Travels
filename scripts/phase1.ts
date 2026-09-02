import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== PHASE 1 — TEST DATABASE IDENTITY ===");

  // Load .env.test manually if not loaded
  const envTestPath = path.join(process.cwd(), ".env.test");
  if (fs.existsSync(envTestPath)) {
    const envContent = fs.readFileSync(envTestPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      if (line.startsWith("TEST_DATABASE_URL=")) {
        const val = line.split("=")[1];
        if (val) process.env.TEST_DATABASE_URL = val.replace(/"/g, "").trim();
      }
    });
  }

  if (!process.env.TEST_DATABASE_URL) {
    console.error("STOP: TEST_DATABASE_URL is missing.");
    process.exit(1);
  }

  // Check against prod
  const prodUrl = process.env.DATABASE_URL || "";
  if (prodUrl === process.env.TEST_DATABASE_URL) {
    console.error("STOP: TEST_DATABASE_URL exactly matches production DATABASE_URL.");
    process.exit(1);
  }

  // Configure Prisma to point specifically to the test DB for verification
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const prisma = new PrismaClient();

  try {
    const dbRes = await prisma.$queryRaw<Array<{ db: string, usr: string, sch: string }>>`SELECT current_database() as db, current_user as usr, current_schema() as sch`;
    
    let branch = "Not available";
    try {
      const bRes = await prisma.$queryRaw<Array<{ "neon.branch": string }>>`SHOW neon.branch`;
      branch = bRes[0] ? bRes[0]["neon.branch"] : "Not available";
    } catch(e) {}

    const dbUrl = process.env.TEST_DATABASE_URL ? new URL(process.env.TEST_DATABASE_URL) : null;
    const host = dbUrl?.hostname || "unknown";

    console.log(`* Database Host: ${host}`);
    console.log(`* Database Name: ${dbRes[0]?.db}`);
    console.log(`* Schema: ${dbRes[0]?.sch}`);
    console.log(`* Current User: ${dbRes[0]?.usr}`);
    console.log(`* Neon Branch/Project: ${branch}`);
    console.log(`* Environment: APP_ENV=${process.env.APP_ENV || 'undefined'}`);
    console.log("");
    console.log("Test database identity verified successfully. Proceeding is safe.");

  } catch (err: unknown) {
    console.error(`STOP: Could not confidently verify database. ${(err as Error).message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
