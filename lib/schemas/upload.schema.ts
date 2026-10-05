import { z } from "zod";
import type { HandleUploadBody } from "@vercel/blob/client";

const generateTokenSchema = z.object({
  type: z.literal("blob.generate-client-token"),
  payload: z.object({
    pathname: z.string().min(1).max(1024),
    multipart: z.boolean().default(false),
    clientPayload: z.string().max(2000).nullable().default(null),
  }),
});
const completedSchema = z.object({
  type: z.literal("blob.upload-completed"),
  payload: z.object({
    blob: z.object({ url: z.string().url(), downloadUrl: z.string().url(), pathname: z.string(), contentType: z.string().optional(), contentDisposition: z.string() }),
    tokenPayload: z.string().nullable().optional(),
  }),
});

function isCompletedBody(value: unknown): value is Extract<HandleUploadBody, { type: "blob.upload-completed" }> {
  return completedSchema.safeParse(value).success;
}

export function parseUploadBody(value: unknown): HandleUploadBody {
  // The Blob SDK verifies a signature of JSON.stringify(body). Preserve original property
  // ordering and any extra callback fields after validation, or a real signature would fail.
  if (isCompletedBody(value)) return value;
  return generateTokenSchema.parse(value);
}
