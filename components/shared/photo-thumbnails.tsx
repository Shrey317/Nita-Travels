"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function PhotoThumbnails({ urls }: { urls: string[] }) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  if (urls.length === 0) return null;

  return (
    <>
      <div className="mt-1 flex flex-wrap gap-1">
        {urls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setOpenUrl(url)}
            aria-label="View photo"
            className="relative h-10 w-10 overflow-hidden rounded-md border border-border transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Image src={url} alt="" fill sizes="40px" className="object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!openUrl} onOpenChange={(open) => !open && setOpenUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Photo</DialogTitle>
          {openUrl && (
            <div className="relative aspect-video w-full">
              <Image src={openUrl} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
