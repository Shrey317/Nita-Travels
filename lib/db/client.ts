import { PrismaClient } from "@prisma/client";

/**
 * Standard Next.js Prisma singleton. Without this, every hot-reload in development would open
 * a fresh PrismaClient (and a fresh connection pool) on top of the last one until Neon's
 * connection limit is exhausted. In production each serverless invocation gets its own module
 * scope, so the global is a no-op there — it only matters for `next dev`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

if (process.env.APP_ENV === "test") {
  if (!process.env.TEST_DATABASE_URL) {
    console.error("SAFETY ABORT: TEST_DATABASE_URL is missing but APP_ENV=test is set.");
    process.exit(1);
  }
  // Force Prisma to use the test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Options for every prisma.$transaction(async (tx) => ...) call in this codebase. Neon's free
 * tier suspends its compute when idle and can take several seconds to wake back up on the next
 * request — comfortably longer than Prisma's 5-second interactive-transaction default, which
 * surfaces as a confusing P2028 "Unable to start a transaction in the given time" error on the
 * first write after a period of inactivity, not as a slow-but-successful request. Generous
 * values here trade a slightly longer worst-case wait for not failing outright on cold starts.
 */
export const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 20_000 };