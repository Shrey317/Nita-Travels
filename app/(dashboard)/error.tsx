"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Full detail stays server/console-side only — the UI shows a generic message (SRS 21).
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-status-red" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-ink">Something went wrong</p>
        <p className="text-sm text-muted">We couldn&apos;t load this page. Please try again.</p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
