"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/shared/multi-select";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { ALL_CATEGORIES, NO_VEHICLE_FILTER_VALUE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";

const CATEGORY_LABELS: Record<string, string> = {
  BrakePads: "Brake Pads",
  UberFees: "Uber Fees",
};

interface TransactionFiltersProps {
  vehicles: { id: string; registration: string }[];
}

function TransactionFiltersInner({ vehicles }: TransactionFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const vehicleIds = searchParams.getAll("vehicleId");
  const categories = searchParams.getAll("category");
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const urlSearch = searchParams.get("search") ?? "";

  // Debounced separately from the URL — pushing a new URL on every keystroke would re-render
  // the whole (server-fetched) table mid-type.
  const [searchInput, setSearchInput] = useState(urlSearch);
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) params.set("search", searchInput);
      else params.delete("search");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const vehicleOptions = [
    ...vehicleIdOptions(vehicles),
    { value: FLEET_WIDE_VEHICLE_ID, label: "All Vehicles / Fleet-Wide" },
    { value: NO_VEHICLE_FILTER_VALUE, label: "No Vehicle" },
  ];
  const categoryOptions = ALL_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] ?? c }));

  function updateListParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    for (const v of values) params.append(key, v);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateSingleParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasActiveFilters = vehicleIds.length > 0 || categories.length > 0 || dateFrom || dateTo || urlSearch;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <MultiSelect label="Vehicle" options={vehicleOptions} selected={vehicleIds} onChange={(v) => updateListParam("vehicleId", v)} />
      <MultiSelect label="Category" options={categoryOptions} selected={categories} onChange={(v) => updateListParam("category", v)} />
      <div className="space-y-1">
        <Label htmlFor="txFilterFrom" className="text-xs">
          From
        </Label>
        <Input
          id="txFilterFrom"
          type="date"
          className="h-9"
          value={dateFrom}
          onChange={(e) => updateSingleParam("dateFrom", e.target.value || null)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="txFilterTo" className="text-xs">
          To
        </Label>
        <Input
          id="txFilterTo"
          type="date"
          className="h-9"
          value={dateTo}
          onChange={(e) => updateSingleParam("dateTo", e.target.value || null)}
        />
      </div>
      <div className="min-w-[180px] flex-1 space-y-1">
        <Label htmlFor="txFilterSearch" className="text-xs">
          Search notes
        </Label>
        <Input
          id="txFilterSearch"
          className="h-9"
          placeholder="Search..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>
      {hasActiveFilters && (
        <Button type="button" variant="ghost" size="sm" className="h-9 text-xs" onClick={() => router.push(pathname)}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

/** See Pagination's equivalent comment — useSearchParams() requires a Suspense ancestor at
 *  build time; wrapping it here means callers don't need to remember it. */
export function TransactionFilters(props: TransactionFiltersProps) {
  return (
    <Suspense fallback={<div className="h-9 w-full max-w-3xl rounded-lg bg-border/60 animate-pulse" />}>
      <TransactionFiltersInner {...props} />
    </Suspense>
  );
}
