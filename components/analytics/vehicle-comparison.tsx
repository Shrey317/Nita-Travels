"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehicleMetric } from "@/lib/analytics";
import { formatZAR, formatKm } from "@/lib/format";
import { Table, TableHead, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

const columns = [
  ["incomeCents", "Revenue", "money"], ["expenseCents", "Expenses", "money"], ["netProfitCents", "Profit", "money"],
  ["margin", "Margin", "ratio"], ["mileageKm", "Mileage", "km"], ["revenuePerKmCents", "Revenue/km", "money"],
  ["costPerKmCents", "Cost/km", "money"], ["profitPerKmCents", "Profit/km", "money"],
  ["repairsCents", "Repairs", "money"], ["maintenanceCents", "Maintenance", "money"],
] as const;
type SortKey = typeof columns[number][0];
const display = (value: number | null, kind: string) => value === null ? "—" : kind === "ratio" ? `${(value * 100).toFixed(1)}%` : kind === "km" ? formatKm(value) : formatZAR(value);

export function VehicleComparison({ rows }: { rows: VehicleMetric[] }) {
  const [selected, setSelected] = useState(rows.slice(0, 2).map(row => row.vehicleId));
  const [sort, setSort] = useState<SortKey>("netProfitCents");
  const [ascending, setAscending] = useState(false);
  const sorted = [...rows].sort((a, b) => {
    const av = a[sort], bv = b[sort];
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    return ascending ? av - bv : bv - av;
  });
  const comparison = rows.filter(row => selected.includes(row.vehicleId));
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center gap-3">
      <label className="text-sm">Sort by <select aria-label="Sort vehicle performance" value={sort} onChange={event => setSort(event.target.value as SortKey)} className="ml-2 rounded-input border bg-card p-2">
        {columns.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select></label>
      <button type="button" onClick={() => setAscending(!ascending)} className="rounded-button border px-3 py-2 text-sm">{ascending ? "Ascending ↑" : "Descending ↓"}</button>
    </div>
    <Table><TableHeader><TableRow><TableHead>Vehicle</TableHead>{columns.map(([key, label]) => <TableHead key={key} className="whitespace-nowrap text-right">{label}</TableHead>)}</TableRow></TableHeader>
      <TableBody>{sorted.map(row => <TableRow key={row.vehicleId}><TableCell><Link className="font-medium text-teal hover:underline" href={`/vehicles/${row.vehicleId}`}>{row.vehicleId}</Link><p className="whitespace-nowrap text-xs text-muted">{row.registration}{!row.active ? " · Inactive" : ""}</p></TableCell>{columns.map(([key, , kind]) => <TableCell key={key} className="whitespace-nowrap text-right font-mono-figures">{display(row[key], kind)}</TableCell>)}</TableRow>)}
      {!rows.length && <TableRow><TableCell colSpan={11}>No vehicles match this selection.</TableCell></TableRow>}</TableBody></Table>
    <fieldset className="min-w-0 space-y-3 rounded-card border bg-card p-4"><legend className="px-1 text-sm font-semibold">Compare vehicles side by side</legend>
      <div className="flex flex-wrap gap-2">{rows.map(row => <label key={row.vehicleId} className="flex min-h-11 items-center gap-2 rounded-input border px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(row.vehicleId)} onChange={event => setSelected(event.target.checked ? [...selected, row.vehicleId] : selected.filter(id => id !== row.vehicleId))} />{row.vehicleId}</label>)}</div>
      {comparison.length ? <Table><TableHeader><TableRow><TableHead>Metric</TableHead>{comparison.map(row => <TableHead key={row.vehicleId} className="text-right">{row.vehicleId}</TableHead>)}</TableRow></TableHeader><TableBody>{columns.map(([key, label, kind]) => <TableRow key={key}><TableCell>{label}</TableCell>{comparison.map(row => <TableCell className="text-right whitespace-nowrap font-mono-figures" key={row.vehicleId}>{display(row[key], kind)}</TableCell>)}</TableRow>)}</TableBody></Table> : <p className="text-sm text-muted">Select vehicles to compare their recorded performance.</p>}
    </fieldset>
  </div>;
}
