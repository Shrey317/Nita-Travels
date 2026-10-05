"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { X, Upload, Loader2, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENTS, isPdfUrl, validateAttachmentFile } from "@/lib/attachments";

interface PhotoUploadProps {
  photoUrls: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

/** Optional photo or PDF attachment, used by Notes, Transactions (receipts), and Mileage entries
 *  (odometer readings) — the feature added at the fleet owner's request in place of the
 *  original spec. Uploads go straight from the browser to Vercel Blob via /api/upload's
 *  short-lived token, not through this app's own server. */
export function PhotoUpload({ photoUrls, onChange, label = "Photos or PDFs (optional)", onUploadingChange }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadController = useRef<AbortController | null>(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const { toast } = useToast();
  const altBase = label.replace(/\s*\(optional\)\s*$/i, "").trim() || "Uploaded file";

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || uploadController.current) return;
    const controller = new AbortController();
    uploadController.current = controller;
    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const uploaded: string[] = [];
      if (photoUrls.length + files.length > MAX_ATTACHMENTS) throw new Error(`Attach no more than ${MAX_ATTACHMENTS} files.`);
      for (const file of Array.from(files)) {
        const error = validateAttachmentFile(file);
        if (error) throw new Error(`${file.name}: ${error}`);
      }
      for (const file of Array.from(files)) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          abortSignal: controller.signal,
        });
        uploaded.push(blob.url);
        onChange([...photoUrls, ...uploaded]);
      }
    } catch (error) {
      toast({
        title: controller.signal.aborted ? "Upload cancelled" : "Upload failed",
        description: controller.signal.aborted ? "Files already uploaded remain attached. You can remove them before saving." : error instanceof Error ? error.message : "Please try again.",
        variant: controller.signal.aborted ? "default" : "destructive",
      });
    } finally {
      uploadController.current = null;
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    onChange(photoUrls.filter((u) => u !== url));
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {photoUrls.map((url, index) => (
          <div key={url} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border">
            {isPdfUrl(url) ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${altBase.toLowerCase()} ${index + 1} of ${photoUrls.length} (PDF, opens in a new tab)`}
                className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface text-muted transition-colors hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <FileText className="h-6 w-6" aria-hidden="true" />
                <span className="text-[10px] font-semibold">PDF</span>
              </a>
            ) : (
              <Image src={url} alt={`${altBase} ${index + 1} of ${photoUrls.length}`} fill sizes="80px" className="object-cover" />
            )}
            <button
              type="button"
              onClick={() => removePhoto(url)}
              disabled={isUploading}
              aria-label={`Remove ${altBase.toLowerCase()} ${index + 1}`}
              className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full bg-navy/80 text-white transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal md:h-6 md:w-6 md:opacity-0 md:group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || photoUrls.length >= MAX_ATTACHMENTS}
          aria-label="Add photo or PDF"
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
          <span className="text-[10px]">{isUploading ? "Uploading" : "Add"}</span>
        </button>
      </div>
      {isUploading && <button type="button" className="min-h-11 rounded px-3 text-sm font-medium text-brand-blue" onClick={() => uploadController.current?.abort()}>Cancel upload</button>}
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
