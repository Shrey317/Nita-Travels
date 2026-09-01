import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { format } from "date-fns";

function hashObject(obj: any) {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

async function main() {
  const isPost = process.argv.includes("--post");
  const isProd = process.argv.includes("--prod");
  
  if (!isProd) {
    const envTestPath = path.join(process.cwd(), ".env.test");
    if (fs.existsSync(envTestPath)) {
      const envContent = fs.readFileSync(envTestPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        if (line.startsWith("TEST_DATABASE_URL=")) {
          const val = line.split("=")[1];
          if (val) {
            process.env.TEST_DATABASE_URL = val.replace(/"/g, "").trim();
            process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
          }
        }
      });
    }
  } else {
    // Load .env for production snapshot
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        if (line.startsWith("DATABASE_URL=")) {
          const val = line.split("=")[1];
          if (val) {
            process.env.DATABASE_URL = val.replace(/"/g, "").trim();
          }
        }
      });
    }
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  let dbName = "unknown";
  let host = "unknown";
  try {
    const res: any = await prisma.$queryRaw`SELECT current_database() as db`;
    dbName = res[0].db;
    host = process.env.TEST_DATABASE_URL ? new URL(process.env.TEST_DATABASE_URL).hostname : "unknown";
  } catch (e: any) {
    console.warn("Could not retrieve DB info:", e.message);
  }

  console.log(`Generating snapshot for ${isPost ? "POST-TEST" : "PRE-TEST"}...`);
  
  // 1. Gather all critical records
  const vehicles = await prisma.vehicle.findMany({ orderBy: { id: 'asc' } });
  const transactions = await prisma.transaction.findMany({ orderBy: { id: 'asc' } });
  const mileageEntries = await prisma.mileageEntry.findMany({ orderBy: { id: 'asc' } });
  const vehicleNotes = await prisma.vehicleNote.findMany({ orderBy: { id: 'asc' } });

  const services = transactions.filter(t => t.category === "Service");
  const repairs = transactions.filter(t => t.category === "Repairs");

  // 2. Generate Hashes
  const vehicleHashes = vehicles.reduce((acc: any, v) => ({ ...acc, [v.id]: hashObject(v) }), {});
  const transactionHashes = transactions.reduce((acc: any, t) => ({ ...acc, [t.id]: hashObject(t) }), {});
  const mileageHashes = mileageEntries.reduce((acc: any, m) => ({ ...acc, [m.id]: hashObject(m) }), {});
  const noteHashes = vehicleNotes.reduce((acc: any, n) => ({ ...acc, [n.id]: hashObject(n) }), {});

  const snapshot = {
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || process.env.NODE_ENV || "unknown",
    databaseName: dbName,
    databaseHost: host,
    counts: {
      Vehicle: vehicles.length,
      Transaction: transactions.length,
      MileageEntry: mileageEntries.length,
      VehicleNote: vehicleNotes.length,
      Service: services.length,
      Repair: repairs.length,
    },
    hashes: {
      Vehicle: vehicleHashes,
      Transaction: transactionHashes,
      MileageEntry: mileageHashes,
      VehicleNote: noteHashes,
    }
  };

  const outputDir = path.join(process.cwd(), "audit-snapshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const isCompare = process.argv.includes("--compare");

  if (isCompare) {
    const prefix = isProd ? "prod-" : "";
    const prePath = path.join(outputDir, `${prefix}pre-test.json`);
    const postPath = path.join(outputDir, `${prefix}post-test.json`);
    
    if (!fs.existsSync(prePath) || !fs.existsSync(postPath)) {
      console.error("Missing pre or post snapshot for comparison!");
      process.exit(1);
    }

    const pre = JSON.parse(fs.readFileSync(prePath, "utf-8"));
    const post = JSON.parse(fs.readFileSync(postPath, "utf-8"));

    console.log(`\n=== Snapshot Comparison (${prefix}pre vs ${prefix}post) ===`);
    
    // Compare Counts
    console.log("\n--- Count Differences ---");
    let countDiffs = 0;
    for (const key of Object.keys(pre.counts)) {
      if (pre.counts[key] !== post.counts[key]) {
        console.log(`${key}: ${pre.counts[key]} -> ${post.counts[key]}`);
        countDiffs++;
      }
    }
    if (countDiffs === 0) console.log("No count differences detected.");

    // Compare Hashes
    console.log("\n--- Hash Differences ---");
    let hashDiffs = 0;
    for (const model of Object.keys(pre.hashes)) {
      const preModel = pre.hashes[model];
      const postModel = post.hashes[model];
      
      const preKeys = new Set(Object.keys(preModel));
      const postKeys = new Set(Object.keys(postModel));
      
      const added = [...postKeys].filter(k => !preKeys.has(k));
      const removed = [...preKeys].filter(k => !postKeys.has(k));
      const modified = [...preKeys].filter(k => postKeys.has(k) && preModel[k] !== postModel[k]);

      if (added.length || removed.length || modified.length) {
        console.log(`\nModel: ${model}`);
        if (added.length) console.log(`  Added: ${added.length} records (${added.slice(0, 3).join(", ")}${added.length > 3 ? "..." : ""})`);
        if (removed.length) console.log(`  Removed: ${removed.length} records (${removed.slice(0, 3).join(", ")}${removed.length > 3 ? "..." : ""})`);
        if (modified.length) console.log(`  Modified: ${modified.length} records (${modified.slice(0, 3).join(", ")}${modified.length > 3 ? "..." : ""})`);
        hashDiffs++;
      }
    }
    if (hashDiffs === 0) console.log("No hash differences detected.");
    
    console.log("\nComparison complete.");
    return;
  }

  const prefix = isProd ? "prod-" : "";
  const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
  const baseFilename = isPost ? `${prefix}post-test` : `${prefix}pre-test`;
  const filename = `${baseFilename}-${timestamp}.json`;
  const latestFilename = `${baseFilename}.json`;
  
  const filePath = path.join(outputDir, filename);
  const latestFilePath = path.join(outputDir, latestFilename);

  const outStr = JSON.stringify(snapshot, null, 2);
  fs.writeFileSync(filePath, outStr);
  fs.writeFileSync(latestFilePath, outStr);
  
  console.log(`Snapshot saved to ${filePath}`);
  
  console.log("\nSnapshot Summary:");
  console.table(snapshot.counts);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Failed to generate snapshot:", err);
  process.exit(1);
});
