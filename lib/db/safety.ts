import { prisma } from "./client";

export async function verifyTestEnvironment(requireDestructive = false) {
  if (process.env.APP_ENV !== "test") {
    throw new Error("SAFETY ABORT: APP_ENV === 'test' is required.");
  }
  
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("SAFETY ABORT: TEST_DATABASE_URL is required.");
  }

  // We explicitly check that the connection string prisma uses is the test one.
  // Next.js and Prisma might have DATABASE_URL set.
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error("SAFETY ABORT: DATABASE_URL must exactly match TEST_DATABASE_URL in test mode. Do not fallback to production.");
  }

  if (
    /prod/i.test(process.env.TEST_DATABASE_URL) ||
    process.env.TEST_DATABASE_URL.includes("amazonaws") ||
    process.env.TEST_DATABASE_URL.includes("supabase.co") && !process.env.TEST_DATABASE_URL.includes("test")
  ) {
    // Basic string heuristics as a first pass, but NOT the primary check.
    throw new Error("SAFETY ABORT: TEST_DATABASE_URL string heuristics detected a potential production target.");
  }

  // 1. Verify actual database identity.
  let dbName = "";
  try {
    const res: any = await prisma.$queryRaw`SELECT current_database() as db`;
    dbName = res[0].db;
  } catch (err: any) {
    throw new Error(`SAFETY ABORT: Could not query actual database identity. ${err.message}`);
  }

  if (!dbName.toLowerCase().includes("test")) {
    throw new Error(`SAFETY ABORT: The connected database identity ('${dbName}') does not appear to be a test database.`);
  }

  // 2. Destructive safety check
  if (requireDestructive) {
    if (process.env.ALLOW_DESTRUCTIVE_TEST_DB !== "true") {
      throw new Error("SAFETY ABORT: Destructive test operation requested, but ALLOW_DESTRUCTIVE_TEST_DB is not explicitly true.");
    }
  }

  return { dbName };
}

export async function verifyProductionReadOnly() {
  if (process.env.APP_ENV === "test") {
    throw new Error("SAFETY ABORT: Production read-only verification must not run with APP_ENV=test.");
  }

  // It should just verify it can connect, but not allow mutations.
  let dbName = "";
  try {
    const res: any = await prisma.$queryRaw`SELECT current_database() as db`;
    dbName = res[0].db;
  } catch (err: any) {
    throw new Error(`SAFETY ABORT: Could not query actual database identity. ${err.message}`);
  }

  if (dbName.toLowerCase().includes("test")) {
    throw new Error(`SAFETY ABORT: Connected to a test database instead of production for read-only verification.`);
  }

  return { dbName };
}
