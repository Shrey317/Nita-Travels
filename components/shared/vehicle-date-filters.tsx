"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/shared/multi-select";
import type { VehicleOption } from "@/components/shared/vehicle-options";

interface VehicleDateFiltersProps {
  vehicleOptions: VehicleOption[];
  /** Keeps input ids unique when more than one filter bar could theoretically render on a page. */
  idPrefix: string;
}

function VehicleDateFiltersInner({ vehicleOptions, idPrefix }: VehicleDateFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const vehicleIds = searchParams.getAll("vehicleId");
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const hasActiveFilters = vehicleIds.length > 0 || dateFrom || dateTo;

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

  return (
    <div className="flex flex-wrap items-end gap-3">
      <MultiSelect label="Vehicle" options={vehicleOptions} selected={vehicleIds} onChange={(v) => updateListParam("vehicleId", v)} />
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-from`} className="text-xs">
          From
        </Label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          className="h-9"
          value={dateFrom}
          onChange={(e) => updateSingleParam("dateFrom", e.target.value || null)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-to`} className="text-xs">
          To
        </Label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          className="h-9"
          value={dateTo}
          onChange={(e) => updateSingleParam("dateTo", e.target.value || null)}
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

export function VehicleDateFilters(props: VehicleDateFiltersProps) {
  return (
    <Suspense fallback={<div className="h-9 w-full max-w-lg rounded-lg bg-border/60 animate-pulse" />}>
      <VehicleDateFiltersInner {...props} />
    </Suspense>
  );
}
