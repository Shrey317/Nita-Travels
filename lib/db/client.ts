import { PrismaClient } from "@prisma/client";

/**
 * Standard Next.js Prisma singleton. Without this, every hot-reload in development would open
 * a fresh PrismaClient (and a fresh connection pool) on top of the last one until Neon's
 * connection limit is exhausted. In production each serverless invocation gets its own module
 * scope, so the global is a no-op there — it only matters for `next dev`.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
