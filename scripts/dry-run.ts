import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("=== SAFETY DRY RUN ===");
  console.log(`Environment (NODE_ENV): ${process.env.NODE_ENV}`);
  console.log(`Environment (APP_ENV): ${process.env.APP_ENV}`);
  
  const dbUrl = process.env.DATABASE_URL || "";
  let host = "unknown";
  try {
    const urlObj = new URL(dbUrl);
    host = urlObj.hostname;
  } catch(e) {}
  console.log(`Database host: ${host}`);

  const prisma = new PrismaClient();
  let dbName = "unknown";
  try {
    const res = await prisma.$queryRaw<Array<{ db: string }>>`SELECT current_database() as db`;
    dbName = res[0]?.db || "unknown";
  } catch (err: unknown) {
    dbName = `Error: ${(err as Error).message}`;
  }

  let dbBranch = "unknown";
  try {
    // If using Neon, we can fetch branch
    const resBranch = await prisma.$queryRaw<Array<{ "neon.branch": string }>>`SHOW neon.branch`;
    if (resBranch && resBranch[0]) {
       dbBranch = resBranch[0]["neon.branch"];
    }
  } catch(err) {
    dbBranch = "Not available (not Neon or error)";
  }

  console.log(`Database name: ${dbName}`);
  console.log(`Database/branch identifier: ${dbBranch}`);
  
  const isProdTarget = 
    process.env.NODE_ENV === "production" || 
    process.env.VERCEL_ENV === "production" ||
    dbName.toLowerCase().includes("prod") ||
    !dbName.toLowerCase().includes("test");

  console.log(`Production target detected: ${isProdTarget ? "YES" : "NO"}`);
  console.log(`Test database confirmed: ${!isProdTarget ? "YES" : "NO"}`);
  console.log(`Destructive operations allowed: ${process.env.ALLOW_DESTRUCTIVE_TEST_DB === "true" ? "YES" : "NO"}`);
  
  const playwrightBase = process.env.BASE_URL || "http://localhost:3000";
  console.log(`Playwright baseURL: ${playwrightBase}`);
  
  const prodBlocked = playwrightBase.includes("prod") || playwrightBase.includes("nita-travels") || playwrightBase.includes("production");
  console.log(`Production URL blocked: ${prodBlocked ? "YES" : "NO (or local)"}`);

  await prisma.$disconnect();

  if (isProdTarget && process.env.APP_ENV === "test") {
    console.error("\nCRITICAL AMBIGUITY: APP_ENV=test but production target detected! STOPPING.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
