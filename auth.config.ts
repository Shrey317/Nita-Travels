import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the NextAuth config. middleware.ts runs on the Edge runtime, which can't
 * load bcryptjs (it needs Node's crypto internals) — so the actual Credentials provider lives
 * in auth.ts instead, and only this route-authorization logic runs in middleware.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  callbacks: {
    authorized({ auth, request: { nextUrl, headers } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        // Already signed in and browsing to /login -> bounce to the dashboard instead.
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      // This header only permits the callback to reach the handler. The Blob SDK verifies
      // its HMAC there, and issuing an upload token still requires an authenticated admin.
      if (nextUrl.pathname === "/api/upload" && headers.has("x-vercel-signature")) return true;
      if (!isLoggedIn && nextUrl.pathname.startsWith("/api/")) {
        return Response.json({ error: "Authentication required" }, { status: 401 });
      }
      return isLoggedIn;
    },
  },
  providers: [], // real providers are added in auth.ts, which is never imported by middleware
};

export default authConfig;
