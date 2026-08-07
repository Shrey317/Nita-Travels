// Postgres DATE columns come back from Prisma as UTC-midnight Date objects. Without forcing
// the process timezone, date-fns' format() would interpret them in the host's local time and
// could display the wrong calendar day near midnight in any non-UTC environment (this mirrors
// the same fix already applied in prisma/seed.ts, for the same reason).
process.env.TZ = "UTC";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'prisma'],
  },
  async headers() {
    /**
     * No security headers were set before this. This uses the static next.config.js approach
     * (Next.js's own CSP docs offer this as the supported alternative to a nonce-based CSP) —
     * a nonce-based CSP is stricter, but wiring it up means the request-level nonce has to flow
     * through middleware.ts, which right now is a single-line NextAuth wrapper
     * (`export const { auth: middleware } = NextAuth(authConfig)`). Composing that with nonce
     * generation is a real change to the code path that gates every authenticated route, and
     * it isn't something that can be verified without a live browser against the deployed app —
     * getting auth gating wrong is a far worse outcome than a CSP that's stricter-but-untested,
     * so this takes the safer, well-documented static option instead.
     *
     * 'unsafe-inline' on script-src is required for Next.js App Router's own hydration/RSC
     * payload scripts to run at all without a nonce — removing it would break every "use client"
     * form in the app, not just tighten security. If you later want the stricter nonce-based
     * CSP, see: https://nextjs.org/docs/app/guides/content-security-policy
     *
     * 'unsafe-eval' is added ONLY in development: `next dev` compiles modules wrapped in eval()
     * by default (for fast rebuilds and readable stack traces) and React Fast Refresh relies on
     * eval-based mechanisms too — without it, the browser silently blocks that machinery and
     * client-side JS never finishes executing, which looks exactly like "every client component
     * is stuck in its pre-hydration state forever" (e.g. a chart stuck on a loading placeholder,
     * since the effect that would swap it for the real content never gets to run). Next's
     * production output doesn't rely on eval, so prod keeps the stricter policy.
     *
     * Test this against a preview deployment before relying on it: open the browser console and
     * confirm login, photo upload (which POSTs straight to Vercel Blob from the browser), and
     * charts all work with no CSP violations reported. Loosen whichever directive is flagged.
     */
    const isDev = process.env.NODE_ENV === "development";
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://*.public.blob.vercel-storage.com",
      "font-src 'self' data:",
      // Dev's HMR client polls/reconnects over a websocket to the same host — 'self' alone
      // doesn't cover the ws:// scheme, so this only widens connect-src in development.
      `connect-src 'self' https://*.public.blob.vercel-storage.com${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera/mic/location aren't used anywhere in the app (photo upload is a plain file
          // picker, not a live camera capture), so these are safe to switch off entirely.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // Redundant with the `robots` export in app/layout.tsx, but this also covers
          // non-HTML responses (e.g. the CSV export) that don't carry a <meta> tag.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
