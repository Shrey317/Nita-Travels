"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
}

/** Pushes a new `page` search param rather than holding client state — the Server Component
 *  page re-fetches and re-renders on navigation, so there's no separate client-side data path
 *  to keep in sync (SRS 18: minimise client-side JavaScript). */
function PaginationInner({ page, limit, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted">
      <span>
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** Next.js requires any component calling useSearchParams() to sit under a Suspense boundary
 *  (a build-time requirement, not just a style preference — omitting it fails `next build`
 *  outright). Wrapping it here means every page using <Pagination> gets this for free instead
 *  of needing to remember it at each call site. */
export function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={<div className="h-[52px] rounded-xl border border-border bg-card" />}>
      <PaginationInner {...props} />
    </Suspense>
  );
}
