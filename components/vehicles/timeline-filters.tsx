"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "transactions", label: "Transactions" },
  { value: "notes", label: "Notes" },
] as const;

/** SRS 13.8: date range + type toggle. Writes to the URL rather than component state — the
 *  Server Component page re-fetches on navigation, so filters, pagination, and the back button
 *  all stay in sync for free. */
function TimelineFiltersInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const type = searchParams.get("type") ?? "all";
  const hasActiveFilters = dateFrom || dateTo || type !== "all";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="timelineDateFrom" className="text-xs">
          From
        </Label>
        <Input
          id="timelineDateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="timelineDateTo" className="text-xs">
          To
        </Label>
        <Input
          id="timelineDateTo"
          type="date"
          value={dateTo}
          onChange={(e) => updateParams({ dateTo: e.target.value || null })}
          className="h-9"
        />
      </div>
      <div className="flex gap-1 rounded-lg border border-border p-1" role="group" aria-label="Filter by type">
        {TYPE_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            size="sm"
            variant={type === opt.value ? "default" : "ghost"}
            aria-pressed={type === opt.value}
            onClick={() => updateParams({ type: opt.value === "all" ? null : opt.value })}
            className="h-7 px-3 text-xs"
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {hasActiveFilters && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => updateParams({ dateFrom: null, dateTo: null, type: null })}
          className="h-9 text-xs"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

/** See Pagination's equivalent comment for why this wrapper exists. */
export function TimelineFilters() {
  return (
    <Suspense fallback={<div className="h-9 w-full max-w-lg rounded-lg bg-border/60 animate-pulse" />}>
      <TimelineFiltersInner />
    </Suspense>
  );
}
