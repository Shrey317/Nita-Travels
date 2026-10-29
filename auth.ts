import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";
import { checkLoginRateLimit, clearLoginRateLimit, getClientIp } from "@/lib/rate-limit";
import { prisma } from '@/lib/db/client';

/**
 * Single admin account, no sign-up flow, no user table (SRS 10). Credentials are compared
 * against ADMIN_USERNAME and a bcrypt hash in ADMIN_PASSWORD_HASH — plaintext passwords are
 * never stored anywhere, including in this file.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session(args) {
      const session = await authConfig.callbacks!.session!(args) as Session;
      if (session.staffRole === 'MANAGER') {
        const account = await prisma.staffAccount.findUnique({ where: { id: session.staffId }, select: { status: true, sessionVersion: true } });
        if (!account || account.status !== 'ACTIVE' || account.sessionVersion !== session.sessionVersion) {
          session.user = undefined as never;
        }
      }
      return session;
    },
  },
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
        if (!username.trim() || username.length > 254 || !password || password.length > 1024) return null;

        // Rate-limit by username+IP so this only throttles repeated guesses against one
        // account/source, not every login attempt from behind a shared IP (office wifi, etc.).
        const loginIdentity = username === process.env.ADMIN_USERNAME ? username : username.trim().toLowerCase();
        const rateLimitKey = `${loginIdentity}:${getClientIp(request)}`;
        const { allowed } = await checkLoginRateLimit(rateLimitKey);
        if (!allowed) {
          console.warn("Login rate limit exceeded.");
          return null;
        }

        const expectedUsername = process.env.ADMIN_USERNAME;
        const expectedPasswordHash = process.env.ADMIN_PASSWORD_HASH?.replace(/\\/g, '');

        if (username !== expectedUsername) {
          const account = await prisma.staffAccount.findUnique({ where: { email: username.trim().toLowerCase() } });
          if (!account || account.status !== 'ACTIVE' || !(await bcrypt.compare(password, account.passwordHash))) return null;
          await clearLoginRateLimit(rateLimitKey).catch(() => {});
          return { id: account.id, name: account.name, email: account.email, role: 'MANAGER', sessionVersion: account.sessionVersion };
        }
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
