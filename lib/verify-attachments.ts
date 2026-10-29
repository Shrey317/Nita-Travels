import { head } from "@vercel/blob";
import { attachmentContentTypes, isTrustedAttachmentUrl, MAX_ATTACHMENT_SIZE } from "@/lib/attachments";
import { ValidationError } from "@/lib/errors";

/** Verify newly attached objects; unchanged historical references remain readable/editable. */
export async function verifyNewAttachments(urls: string[], existing: string[] = []) {
  const added = [...new Set(urls)].filter(url => !existing.includes(url));
  if (!added.length) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const store = token?.match(/^vercel_blob_rw_([a-z0-9]+)_/i)?.[1]?.toLowerCase();
  if (!store) throw new ValidationError("Attachment storage is unavailable. Try again later.", "photoUrls");
  for (const value of added) {
    if (!isTrustedAttachmentUrl(value) || new URL(value).hostname.toLowerCase() !== `${store}.public.blob.vercel-storage.com`) {
      throw new ValidationError("Attach a file uploaded to this application's storage.", "photoUrls");
    }
    try {
      // HEAD only succeeds once the object exists. Provider metadata, rather than browser
      // declarations, verifies size/type/completion without downloading an arbitrary URL.
      const blob = await head(value, { token });
      if (blob.url !== value || blob.size <= 0 || blob.size > MAX_ATTACHMENT_SIZE ||
          !attachmentContentTypes(blob.pathname).includes(blob.contentType)) throw new Error("Invalid metadata");
    } catch {
      throw new ValidationError("The attachment is incomplete or invalid. Upload it again before saving.", "photoUrls");
    }
  }
}
