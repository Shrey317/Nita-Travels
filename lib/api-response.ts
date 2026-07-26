/**
 * lib/api-response.ts
 *
 * Every API route funnels its errors through handleApiError so the mapping from failure to
 * HTTP status is defined in exactly one place (SRS Section 5, 16, 19, 21):
 *   - Zod validation failures  -> 400, with the offending field named
 *   - NotFoundError            -> 404
 *   - ConflictError            -> 409
 *   - UnauthorizedError        -> 401
 *   - anything else            -> 500, generic message, full detail logged server-side only
 *
 * Nothing here ever puts a Prisma error message, a stack trace, or an env var value in the
 * response body — only the four cases above (and their safe, pre-written messages) reach the
 * client.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { NotFoundError, ValidationError, ConflictError, UnauthorizedError } from "@/lib/errors";

/** Defense-in-depth session check inside route handlers, on top of middleware's route gating —
 *  so a write route is never one refactor away from accidentally becoming unauthenticated. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session;
}

export function jsonError(message: string, status: number, field?: string) {
  return NextResponse.json(field ? { error: message, field } : { error: message }, { status });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const first = error.errors[0];
    return jsonError(first?.message ?? "Invalid input", 400, first?.path?.join(".") || undefined);
  }
  if (error instanceof ValidationError) return jsonError(error.message, 400, error.field);
  if (error instanceof NotFoundError) return jsonError(error.message, 404);
  if (error instanceof ConflictError) return jsonError(error.message, 409);
  if (error instanceof UnauthorizedError) return jsonError(error.message, 401);

  // Unexpected failure (e.g. a Prisma error) — log the real thing server-side, tell the
  // client nothing beyond "something went wrong".
  console.error("Unhandled API error:", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
