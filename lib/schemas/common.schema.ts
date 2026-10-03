import { z } from "zod";
import { isTrustedAttachmentUrl, MAX_ATTACHMENTS } from "@/lib/attachments";

/** PostgreSQL Int is signed 32-bit; reject overflow before Prisma receives a write. */
export const MAX_DATABASE_INT = 2_147_483_647;
export const nonnegativeIntegerSchema = z.number().int().min(0).max(MAX_DATABASE_INT);
export const positiveIntegerSchema = nonnegativeIntegerSchema.min(1);

/** Date columns represent calendar days. Reject coercions such as null -> 1970-01-01. */
export const calendarDateSchema = z.preprocess((value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return value;
  const day = value.slice(0, 10);
  const parsed = new Date(value);
  const calendarDay = new Date(`${day}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || !Number.isFinite(calendarDay.getTime()) || calendarDay.toISOString().slice(0, 10) !== day) return value;
  return calendarDay;
}, z.date()).transform((date) => new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`));

export const attachmentUrlsSchema = z.array(
  z.string().url().refine(isTrustedAttachmentUrl, "Choose an image or PDF uploaded to the application's Blob storage")
).max(MAX_ATTACHMENTS, `Attach no more than ${MAX_ATTACHMENTS} files`).default([]);
