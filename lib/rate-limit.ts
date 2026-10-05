/**
 * lib/rate-limit.ts
 *
 * Database-backed login attempt limits, shared by serverless instances. Each account/IP
 * key has a 15-minute window and an atomic attempt counter in the RateLimit table.
 *
 * A storage failure temporarily denies authentication rather than bypassing attempt limits.
 */

import { prisma } from "@/lib/db/client";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

/** Call before attempting authentication. Returns whether the attempt is allowed. */
export async function checkLoginRateLimit(key: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const now = new Date();
    
    // Clean up expired tokens for this key
    await prisma.rateLimit.deleteMany({
      where: { key, expiresAt: { lt: now } }
    });

    const record = await prisma.rateLimit.upsert({
      where: { key },
      update: {
        points: { increment: 1 }
      },
      create: {
        key,
        points: 1,
        expiresAt: new Date(now.getTime() + WINDOW_MS)
      }
    });

    if (record.points > MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.ceil((record.expiresAt.getTime() - now.getTime()) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
    }

    return { allowed: true };
  } catch {
    console.error("Login attempt limits are temporarily unavailable.");
    return { allowed: false, retryAfterSeconds: 30 };
  }
}

/** Call after a successful login so a legitimate user's earlier typos don't linger against them. */
export async function clearLoginRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.delete({
      where: { key }
    });
  } catch {
    // Ignore if not found
  }
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request | undefined): string {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request?.headers.get("x-real-ip") ?? "unknown";
}
