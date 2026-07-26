/**
 * lib/errors.ts
 *
 * A small typed error hierarchy. API routes catch these and map them to the correct HTTP
 * status (see lib/api-response.ts) instead of leaking raw Prisma errors or stack traces to
 * the client (SRS 19, 21). Anything that isn't one of these is treated as unexpected and
 * logged server-side before returning a generic 500.
 */

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}
