import NextAuth from "next-auth";
import authConfig from "@/auth.config";

/** All routes except /api/auth/* and /login require an authenticated session (SRS 10). */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
