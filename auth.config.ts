import type { NextAuthConfig } from "next-auth";

/**
 * Shared route authorization. Credential verification and database access stay in auth.ts;
 * middleware only verifies the session using this configuration on the Node.js runtime.
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
