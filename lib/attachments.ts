/**
 * lib/attachments.ts
 *
 * Shared by photo-upload.tsx and photo-thumbnails.tsx now that both accept PDFs alongside
 * images (Vercel Blob URLs preserve the original filename's extension, so a suffix check is
 * reliable here — this app never generates or renames these URLs itself).
 */
export function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().split("?")[0]?.endsWith(".pdf") ?? false;
  }
}
