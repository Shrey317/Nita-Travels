import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireSession, handleApiError } from "@/lib/api-response";

/**
 * Generates short-lived client-upload tokens for Vercel Blob rather than proxying file bytes
 * through this route — the file goes straight from the browser to Blob storage, avoiding
 * Vercel serverless functions' request-body size limits. Gated behind requireSession() so only
 * the authenticated admin can ever obtain an upload token.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody;
    await requireSession();

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"],
        maximumSizeInBytes: 10 * 1024 * 1024, // 10MB
        addRandomSuffix: true,
      }),
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
