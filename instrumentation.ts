/**
 * Runs once when the server (or, on Vercel, each serverless function instance) starts up —
 * the reliable place for this, since next.config.js's top-level code isn't guaranteed to
 * re-execute inside every function invocation the way this hook is. See the comment in
 * next.config.js for why forcing UTC matters here (date-only Postgres columns + date-fns'
 * local-time formatting otherwise risk a day shift near midnight in a non-UTC environment).
 *
 * Stable in Next.js 14 — no experimental flag needed.
 */
export function register() {
  process.env.TZ = "UTC";
}
