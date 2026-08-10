import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-surface px-4 text-center">
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal/20 blur-[100px]" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 animate-scale-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal/10">
          <Compass className="h-8 w-8 text-muted" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-ink">Page not found</p>
          <p className="text-sm text-muted">That page doesn&apos;t exist, or the record may have been removed.</p>
        </div>
        <Button asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
