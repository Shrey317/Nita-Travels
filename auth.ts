import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "@/auth.config";

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
      async authorize(credentials) {
        const username = credentials?.username;
        const password = credentials?.password;
        if (typeof username !== "string" || typeof password !== "string") return null;

        const expectedUsername = process.env.ADMIN_USERNAME;
        const passwordHash = process.env.ADMIN_PASSWORD_HASH;
        if (!expectedUsername || !passwordHash) {
          // Misconfigured environment — fail closed, and don't hint at which var is missing.
          console.error("Auth misconfigured: ADMIN_USERNAME or ADMIN_PASSWORD_HASH is not set");
          return null;
        }
        if (username !== expectedUsername) return null;

        const passwordMatches = await bcrypt.compare(password, passwordHash);
        if (!passwordMatches) return null;

        return { id: "admin", name: "Nita Travels Admin" };
      },
    }),
  ],
});
