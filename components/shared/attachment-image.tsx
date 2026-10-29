"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { isTrustedAttachmentUrl } from "@/lib/attachments";

/** Keep historical references intact even when a browser cannot preview their format. */
export function AttachmentImage({ src, alt, sizes, className }: { src: string; alt: string; sizes: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const trusted = isTrustedAttachmentUrl(src);
  const downloadable = trusted && /\.(heic|heif)(?:\?|$)/i.test(src);
  if (!trusted || failed || downloadable) return (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1 bg-surface text-muted" role="img" aria-label={alt || "Attachment preview unavailable"}>
      <FileText className="h-5 w-5" aria-hidden="true" />
      <span className="text-[10px]">{downloadable ? "HEIC" : "No preview"}</span>
    </span>
  );
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />;
}
