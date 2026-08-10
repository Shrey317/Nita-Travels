"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Catches errors in routes outside app/(dashboard) — currently just /login — since that group
 *  has its own more specific error.tsx. This one can safely use the normal design system, unlike
 *  global-error.tsx, which only activates for failures in the root layout itself. */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-surface px-4 text-center">
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-red/20 blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 animate-scale-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-status-red/10">
          <AlertCircle className="h-8 w-8 animate-pulse text-status-red" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-ink">Something went wrong</p>
          <p className="text-sm text-muted">Please try again.</p>
        </div>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
