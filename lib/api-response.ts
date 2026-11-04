/**
 * lib/api-response.ts
 *
 * Shared response + error-mapping helpers for every /app/api/* route handler.
 * Keeps status codes and JSON envelopes consistent across the API surface.
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";
import { reportOperationalError } from "./monitoring";

export function jsonError(message: string, status: number, field?: string) {
  const body: { error: string; field?: string } = { error: message };
  if (field) body.field = field;
  return NextResponse.json(body, { status });
}

/**
 * Throws UnauthorizedError if there is no active session. Route handlers call this as their
 * first line as a defence-in-depth check behind middleware.ts (SRS 19).
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new UnauthorizedError();
  }
  return session;
}

/**
 * Throws ForbiddenError (403) if the authenticated user is not the Administrator.
 * Used on all edit, delete, and user-management routes.
 */
export async function requireAdmin() {
  const session = await requireSession();
  if (session.staffRole !== "ADMIN") {
    throw new ForbiddenError("Administrator access required.");
  }
  return session;
}

/**
 * Server-component helper returning true only when the current session belongs to the Admin.
 */
export async function isAdminSession(): Promise<boolean> {
  const session = await auth();
  return session?.staffRole === "ADMIN";
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return jsonError(error.message, 403);
  }
  if (error instanceof ValidationError) {
    return jsonError(error.message, 400, error.field);
  }
  if (error instanceof ZodError) {
    const first = error.errors[0];
    const field = first?.path?.join(".") || undefined;
    return jsonError(first?.message ?? "Invalid input", 400, field);
  }
  if (error instanceof NotFoundError) {
    return jsonError(error.message, 404);
  }
  if (error instanceof ConflictError) {
    return jsonError(error.message, 409);
  }
  if (error instanceof SyntaxError) {
    return jsonError("Malformed JSON in request body", 400);
  }

  reportOperationalError("api_route", error);
  return jsonError("An unexpected error occurred. Please try again.", 500);
}
