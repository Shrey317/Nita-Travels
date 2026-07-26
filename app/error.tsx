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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <AlertCircle className="h-10 w-10 text-status-red" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-ink">Something went wrong</p>
        <p className="text-sm text-muted">Please try again.</p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
