import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { checkLoginRateLimit, clearLoginRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Single admin account, no sign-up flow, no user table (SRS 10). Credentials are compared
 * against ADMIN_USERNAME and a bcrypt hash in ADMIN_PASSWORD_HASH — plaintext passwords are
 * never stored anywhere, including in this file.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") return null;

        // Rate-limit by username+IP so this only throttles repeated guesses against one
        // account/source, not every login attempt from behind a shared IP (office wifi, etc.).
        const rateLimitKey = `${username}:${getClientIp(request)}`;
        const isTestMode = process.env.PLAYWRIGHT_TEST === "true";

        if (!isTestMode) {
          const { allowed } = await checkLoginRateLimit(rateLimitKey);
          if (!allowed) {
            console.warn(`Login rate limit hit for key: ${rateLimitKey.split(":")[1]}`);
            return null;
          }
        }

        const expectedUsername = isTestMode && process.env.TEST_USERNAME ? process.env.TEST_USERNAME : process.env.ADMIN_USERNAME;
        let expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH?.replace(/\\/g, '');

        // If testing and a plaintext test password is provided, hash it on the fly 
        // so that the exact same bcrypt.compare() code path is exercised.
        if (isTestMode && process.env.TEST_PASSWORD) {
          expectedPasswordHash = bcrypt.hashSync(process.env.TEST_PASSWORD, 10);
        }

        console.log("[auth.ts] isTestMode:", isTestMode, "TEST_USERNAME:", process.env.TEST_USERNAME, "TEST_PASSWORD:", !!process.env.TEST_PASSWORD);
        if (!expectedUsername || !expectedPasswordHash) {
          console.error("Missing credentials in environment variables.");
          return null;
        }
        
        if (username !== expectedUsername) return null;

        const passwordMatches = await bcrypt.compare(password, expectedPasswordHash);
        if (!passwordMatches) return null;

        await clearLoginRateLimit(rateLimitKey).catch(() => {});
        return { id: "admin", name: "Nita Travels Admin", username: "admin", role: "ADMIN" };
      },
    }),
  ],
});
