/**
 * lib/rate-limit.ts
 *
 * A minimal in-memory, best-effort rate limiter for login attempts (audit finding: no brute-force
 * protection existed on the credentials login route). This is intentionally simple rather than a
 * full token-bucket implementation, because its only job is to slow down automated guessing
 * against the single admin account, not to be a general-purpose limiter.
 *
 * Known limitation: state lives in a module-level Map, so it only protects within one warm
 * serverless instance and resets on cold start / is not shared across regions. For a
 * single-admin-account internal tool that's a real but proportionate trade-off — it still meaningfully
 * slows down a script hammering the login route in one session. If the fleet grows past a single
 * admin, or this needs to hold up against a determined distributed attempt, swap the Map below for
 * Vercel KV or Upstash Redis (same function signature, so nothing else here would need to change).
 *
 * Fails OPEN: any unexpected error in this module allows the login attempt through rather than
 * blocking it. A bug in rate-limiting code should never be the reason the admin can't log in.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

interface Bucket {
  count: number;
  windowStart: number;
}

const attempts = new Map<string, Bucket>();

// Bound memory use — an attacker cycling through many fake usernames shouldn't grow this map
// without limit. Well above what one admin account's real key churn would ever need.
const MAX_TRACKED_KEYS = 1000;

/** Call before attempting authentication. Returns whether the attempt is allowed. */
export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  try {
    const now = Date.now();
    const bucket = attempts.get(key);

    if (!bucket || now - bucket.windowStart > WINDOW_MS) {
      attempts.set(key, { count: 1, windowStart: now });
      return { allowed: true };
    }

    if (bucket.count >= MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 1) };
    }

    bucket.count += 1;
    return { allowed: true };
  } catch (error) {
    console.error("Rate limiter error — failing open:", error);
    return { allowed: true };
  }
}

/** Call after a successful login so a legitimate user's earlier typos don't linger against them. */
export function clearLoginRateLimit(key: string): void {
  try {
    attempts.delete(key);
    if (attempts.size > MAX_TRACKED_KEYS) {
      const oldestKey = attempts.keys().next().value;
      if (oldestKey !== undefined) attempts.delete(oldestKey);
    }
  } catch (error) {
    console.error("Rate limiter cleanup error (non-fatal):", error);
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
