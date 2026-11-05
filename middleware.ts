// Node.js middleware must use the same database-backed session validation as route
// handlers. A revoked manager JWT must not redirect /login back to the dashboard.
export { auth as middleware } from "@/auth";

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|favicon\\.svg$).*)"],
};
