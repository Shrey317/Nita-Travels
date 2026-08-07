"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isPdfUrl } from "@/lib/attachments";

interface PhotoThumbnailsProps {
  urls: string[];
  /** Context for accessible alt text, e.g. "Odometer photo for CR01 on 12 Mar 2026" — each
   *  thumbnail's alt becomes "{label} 1", "{label} 2", etc. when there's more than one. Falls
   *  back to a generic label rather than alt="" (SRS a11y: informative images need real alt
   *  text, not empty strings — these are receipts/odometer readings/note attachments, not
   *  decoration). */
  label?: string;
}

export function PhotoThumbnails({ urls, label = "Attached file" }: PhotoThumbnailsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (urls.length === 0) return null;

  const altFor = (index: number) => (urls.length > 1 ? `${label} ${index + 1} of ${urls.length}` : label);
  const activeUrl = openIndex !== null ? urls[openIndex] : undefined;

  return (
    <>
      <div className="mt-1 flex flex-wrap gap-1">
        {urls.map((url, index) =>
          isPdfUrl(url) ? (
            // PDFs open directly in a new tab rather than the lightbox below — that's built to
            // display an <Image>, and the browser's own PDF viewer is more capable anyway.
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${altFor(index).toLowerCase()} (PDF, opens in a new tab)`}
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-border bg-surface text-muted transition-colors hover:text-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <button
              key={url}
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-label={`View ${altFor(index).toLowerCase()}`}
              className="relative h-10 w-10 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Image src={url} alt="" fill sizes="40px" className="object-cover" />
            </button>
          )
        )}
      </div>
      <Dialog open={activeUrl !== undefined} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{openIndex !== null ? altFor(openIndex) : "Photo"}</DialogTitle>
          {activeUrl !== undefined && openIndex !== null && (
            <div className="relative aspect-video w-full">
              <Image src={activeUrl} alt={altFor(openIndex)} fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
