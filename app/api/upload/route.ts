export const dynamic = "force-dynamic";

import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-response";
import { attachmentContentTypes, MAX_ATTACHMENT_SIZE, isAllowedAttachmentPath } from "@/lib/attachments";
import { UnauthorizedError, ValidationError } from "@/lib/errors";
import { parseUploadBody } from "@/lib/schemas/upload.schema";

/**
 * Generates short-lived client-upload tokens for Vercel Blob rather than proxying file bytes
 * through this route — the file goes straight from the browser to Blob storage, avoiding
 * Vercel serverless functions' request-body size limits. Token generation requires an admin
 * session; completion callbacks are authenticated by the Blob SDK's HMAC verification.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = parseUploadBody(await request.json());
    if (body.type === "blob.generate-client-token") {
      await requireSession();
      const callback = new URL(body.payload.callbackUrl);
      const endpoint = new URL(request.url);
      if (callback.origin !== endpoint.origin || callback.pathname !== endpoint.pathname) {
        throw new ValidationError("Invalid upload callback URL");
      }
    } else if (!request.headers.get("x-vercel-signature")) {
      throw new UnauthorizedError();
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        await requireSession();
        if (!isAllowedAttachmentPath(pathname)) throw new ValidationError("Choose a JPEG, PNG, WebP, HEIC, HEIF or PDF file");
        return { allowedContentTypes: attachmentContentTypes(pathname), maximumSizeInBytes: MAX_ATTACHMENT_SIZE, addRandomSuffix: true };
      },
      onUploadCompleted: async () => {
        // Nothing to persist here — the uploading form captures the returned blob URL itself
        // and includes it in the record it saves right after.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return handleApiError(error);
  }
}
