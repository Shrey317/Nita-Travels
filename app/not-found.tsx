import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <Compass className="h-10 w-10 text-muted" aria-hidden="true" />
      <div className="space-y-1">
        <p className="text-lg font-semibold text-ink">Page not found</p>
        <p className="text-sm text-muted">That page doesn&apos;t exist, or the record may have been removed.</p>
      </div>
      <Button asChild>
        <Link href="/">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
