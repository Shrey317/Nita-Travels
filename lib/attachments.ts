/**
 * lib/attachments.ts
 *
 * Shared by photo-upload.tsx and photo-thumbnails.tsx now that both accept PDFs alongside
 * images (Vercel Blob URLs preserve the original filename's extension, so a suffix check is
 * reliable here — this app never generates or renames these URLs itself).
 */
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 20;
export const ATTACHMENT_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
export const ATTACHMENT_ACCEPT = ".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf";

const EXTENSION_TYPES: Record<string, string[]> = {
  jpg: ["image/jpeg"], jpeg: ["image/jpeg"], png: ["image/png"], webp: ["image/webp"],
  heic: ["image/heic", "image/heif"], heif: ["image/heif", "image/heic"], pdf: ["application/pdf"],
};

export function isAllowedAttachmentPath(pathname: string): boolean {
  return !/[\\\u0000-\u001f]/.test(pathname) && /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(pathname);
}

export function attachmentContentTypes(pathname: string): string[] {
  return EXTENSION_TYPES[pathname.split(".").pop()?.toLowerCase() ?? ""] ?? [];
}

export function isTrustedAttachmentUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname) &&
      isAllowedAttachmentPath(decodeURIComponent(url.pathname));
  } catch { return false; }
}

export function validateAttachmentFile(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!isAllowedAttachmentPath(file.name)) return "Choose a JPEG, PNG, WebP, HEIC, HEIF or PDF file.";
  if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE) return "Files must be non-empty and no larger than 10 MB.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSION_TYPES[extension]?.includes(file.type)) return "The file type does not match its extension.";
  return null;
}

export function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().split("?")[0]?.endsWith(".pdf") ?? false;
  }
}
