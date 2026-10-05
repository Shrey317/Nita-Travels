"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { PERIOD_OPTIONS, COMPARISON_OPTIONS, dateKey, type AnalyticsSelection } from "@/lib/date-ranges";
import { Button } from "@/components/ui/button";

export function AnalyticsFilters({ selection, vehicles }: { selection: AnalyticsSelection; vehicles: { id: string; registration: string }[] }) {
  // URL navigation (including Back) must reset draft controls to the applied selection.
  return <FilterForm key={JSON.stringify(selection)} selection={selection} vehicles={vehicles} />;
}

function FilterForm({ selection, vehicles }: { selection: AnalyticsSelection; vehicles: { id: string; registration: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [range, setRange] = useState(selection.preset);
  const [from, setFrom] = useState(dateKey(new Date(selection.range.from)));
  const [to, setTo] = useState(dateKey(new Date(selection.range.to)));
  const control = "h-11 w-full min-w-0 rounded-input border border-border bg-card px-3 text-sm text-ink";
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    new FormData(event.currentTarget).forEach((value, name) => { if (typeof value === "string" && value) params.set(name, value); });
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }
  return (
    <form onSubmit={apply} aria-busy={pending} className="grid gap-3 rounded-card border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Analytics filters">
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
      {range === "custom" && <>
        <label className="space-y-1 text-xs font-medium text-muted">From<input name="dateFrom" type="date" required max={to} value={from} onChange={event => setFrom(event.target.value)} className={control} /></label>
        <label className="space-y-1 text-xs font-medium text-muted">To<input name="dateTo" type="date" required min={from} value={to} onChange={event => setTo(event.target.value)} className={control} /></label>
      </>}
      <div className="flex items-end"><Button type="submit" disabled={pending} className="w-full">{pending && <Loader2 aria-hidden="true" className="animate-spin" />}{pending ? "Updating…" : "Apply filters"}</Button></div>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2 xl:col-span-4"><p className="text-xs leading-relaxed text-muted">{selection.label} · {selection.comparisonLabel}. Current periods include their full calendar range.</p><Link href={pathname} scroll={false} className="inline-flex min-h-9 items-center text-xs font-medium text-brand-blue hover:underline">Reset filters</Link></div>
    </form>
  );
}
