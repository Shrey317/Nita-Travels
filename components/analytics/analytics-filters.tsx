"use client";

import { useState } from "react";
import { PERIOD_OPTIONS, COMPARISON_OPTIONS, dateKey, type AnalyticsSelection } from "@/lib/date-ranges";
import { Button } from "@/components/ui/button";

export function AnalyticsFilters({ selection, vehicles }: { selection: AnalyticsSelection; vehicles: { id: string; registration: string }[] }) {
  const [range, setRange] = useState(selection.preset);
  const control = "h-10 w-full min-w-0 rounded-input border border-border bg-card px-3 text-sm text-ink";
  return (
    <form className="grid gap-3 rounded-card border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Analytics filters">
      <label className="space-y-1 text-xs font-medium text-muted">Period
        <select name="range" aria-label="Period" value={range} onChange={event => setRange(event.target.value)} className={control}>
          {PERIOD_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium text-muted">Vehicle
        <select name="vehicleId" aria-label="Vehicle" defaultValue={selection.vehicleId ?? ""} className={control}>
          <option value="">All vehicles and fleet overhead</option>
          {vehicles.map(vehicle => <option key={vehicle.id} value={vehicle.id}>{vehicle.id} · {vehicle.registration}</option>)}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium text-muted">Compare with
        <select name="comparison" aria-label="Compare with" defaultValue={selection.comparison} className={control}>
          {COMPARISON_OPTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <div className="flex items-end"><Button type="submit" className="w-full">Apply filters</Button></div>
      {range === "custom" && <>
        <label className="space-y-1 text-xs font-medium text-muted">From<input name="dateFrom" type="date" required defaultValue={dateKey(new Date(selection.range.from))} className={control} /></label>
        <label className="space-y-1 text-xs font-medium text-muted">To<input name="dateTo" type="date" required defaultValue={dateKey(new Date(selection.range.to))} className={control} /></label>
      </>}
      <p className="text-xs leading-relaxed text-muted sm:col-span-2 xl:col-span-4">{selection.label} · {selection.comparisonLabel}. Figures use recorded transactions and mileage within these dates. Current periods include their full calendar range.</p>
    </form>
  );
}
