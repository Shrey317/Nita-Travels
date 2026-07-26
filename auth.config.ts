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
    maxAge: 8 * 60 * 60, // 8 hours (SRS 10)
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) {
        // Already signed in and browsing to /login -> bounce to the dashboard instead.
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return isLoggedIn;
    },
  },
  providers: [], // real providers are added in auth.ts, which is never imported by middleware
};

export default authConfig;
