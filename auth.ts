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
        if (!username.trim() || username.length > 100 || !password || password.length > 1024) return null;

        // Rate-limit by username+IP so this only throttles repeated guesses against one
        // account/source, not every login attempt from behind a shared IP (office wifi, etc.).
        const rateLimitKey = `${username}:${getClientIp(request)}`;
        const { allowed } = await checkLoginRateLimit(rateLimitKey);
        if (!allowed) {
          console.warn("Login rate limit exceeded.");
          return null;
        }

        const expectedUsername = process.env.ADMIN_USERNAME;
        const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH?.replace(/\\/g, '');

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
