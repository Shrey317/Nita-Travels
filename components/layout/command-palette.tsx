"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command } from "cmdk";
import { Search, Car, Receipt, Wrench, Loader2, FileText, PlusCircle, Gauge, ClipboardCheck } from "lucide-react";
import { globalSearch, SearchResults } from "@/lib/actions/search";

export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (o: boolean) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Extract vehicleId if we are on a vehicle profile page
  const vehicleIdMatch = pathname?.match(/^\/vehicles\/([^/]+)$/);
  const currentVehicleId = vehicleIdMatch && vehicleIdMatch[1] !== "new" ? vehicleIdMatch[1] : null;
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    setResults(null);
    const timer = setTimeout(async () => {
      try {
        const data = await globalSearch(query.trim());
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, open]);

  const onSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Command.Dialog shouldFilter={false} open={open} onOpenChange={setOpen} label="Global Command Menu" className="fixed left-1/2 top-[20%] z-[100] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-card border border-border bg-card p-0 shadow-card-elevated outline-none">
      <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 text-muted" />
        <Command.Input 
          autoFocus
          aria-label="Search fleet records"
          placeholder="Search vehicles, records, insurance, mileage…"
          maxLength={100}
          value={query}
          onValueChange={setQuery}
          className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50" 
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>
      <Command.List className="max-h-[min(400px,60vh)] overflow-y-auto overflow-x-hidden p-2">
        <Command.Empty className="py-6 text-center text-sm text-muted">
          {loading ? "Searching fleet records…" : error ? "Search could not load. Change your search to try again." : query.trim().length < 2 ? "Type at least 2 characters to search." : "No results found."}
        </Command.Empty>

        {!query && (
          <Command.Group heading="Quick Actions" className="px-2 py-2 text-xs font-medium text-muted">
            <Command.Item onSelect={() => onSelect("/vehicles/new")} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1">
              <Car className="mr-2 h-4 w-4 text-muted" />
              <span className="text-ink">Add New Vehicle</span>
            </Command.Item>
            <Command.Item onSelect={() => onSelect(currentVehicleId ? `/transactions/new?vehicleId=${currentVehicleId}` : "/transactions/new")} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1">
              <PlusCircle className="mr-2 h-4 w-4 text-muted" />
              <span className="text-ink">Log Transaction {currentVehicleId && `(${currentVehicleId})`}</span>
            </Command.Item>
            <Command.Item onSelect={() => onSelect(currentVehicleId ? `/mileage/new?vehicleId=${currentVehicleId}` : "/mileage/new")} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Gauge className="mr-2 h-4 w-4 text-muted" />
              <span className="text-ink">Record Mileage {currentVehicleId && `(${currentVehicleId})`}</span>
            </Command.Item>
          </Command.Group>
        )}

        {results?.vehicles?.length ? (
          <Command.Group heading="Vehicles" className="px-2 py-2 text-xs font-medium text-muted">
            {results.vehicles.map((v) => (
              <Command.Item key={v.id} value={v.id} onSelect={() => onSelect(v.href)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1 last:mb-0">
                <Car className="mr-2 h-4 w-4 text-muted" />
                <div className="flex flex-col">
                  <span className="text-ink">{v.title}</span>
                  <span className="text-xs text-muted">{v.subtitle}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}

        {results?.transactions?.length ? (
          <Command.Group heading="Transactions" className="px-2 py-2 text-xs font-medium text-muted">
            {results.transactions.map((t) => (
              <Command.Item key={t.id} value={t.id} onSelect={() => onSelect(t.href)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1 last:mb-0">
                <Receipt className="mr-2 h-4 w-4 text-muted" />
                <div className="flex flex-col">
                  <span className="text-ink">{t.title}</span>
                  <span className="text-xs text-muted">{t.subtitle}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
        
        {results?.repairs?.length ? (
          <Command.Group heading="Repairs" className="px-2 py-2 text-xs font-medium text-muted">
            {results.repairs.map((r) => (
              <Command.Item key={r.id} value={r.id} onSelect={() => onSelect(r.href)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1 last:mb-0">
                <Wrench className="mr-2 h-4 w-4 text-muted" />
                <div className="flex flex-col">
                  <span className="text-ink">{r.title}</span>
                  <span className="text-xs text-muted">{r.subtitle}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}

        {results?.services?.length ? (
          <Command.Group heading="Services" className="px-2 py-2 text-xs font-medium text-muted">
            {results.services.map((item) => <Command.Item key={item.id} value={item.id} onSelect={() => onSelect(item.href)} className="mb-1 flex cursor-default items-center rounded-input px-2 py-2 text-sm outline-none aria-selected:bg-brand-blue/10">
              <ClipboardCheck className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="text-ink">{item.title}</p><p className="text-xs text-muted">{item.subtitle}</p></div>
            </Command.Item>)}
          </Command.Group>
        ) : null}
        {results?.mileage?.length ? (
          <Command.Group heading="Mileage" className="px-2 py-2 text-xs font-medium text-muted">
            {results.mileage.map((item) => <Command.Item key={item.id} value={item.id} onSelect={() => onSelect(item.href)} className="mb-1 flex cursor-default items-center rounded-input px-2 py-2 text-sm outline-none aria-selected:bg-brand-blue/10">
              <Gauge className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" /><div className="min-w-0"><p className="text-ink">{item.title}</p><p className="text-xs text-muted">{item.subtitle}</p></div>
            </Command.Item>)}
          </Command.Group>
        ) : null}

        {results?.notes?.length ? (
          <Command.Group heading="Notes" className="px-2 py-2 text-xs font-medium text-muted">
            {results.notes.map((n) => (
              <Command.Item key={n.id} value={n.id} onSelect={() => onSelect(n.href)} className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-brand-blue/10 aria-selected:text-brand-blue data-[disabled]:pointer-events-none data-[disabled]:opacity-50 mb-1 last:mb-0">
                <FileText className="mr-2 h-4 w-4 text-muted" />
                <div className="flex flex-col">
                  <span className="text-ink">{n.title}</span>
                  <span className="text-xs text-muted">{n.subtitle}</span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
    </Command.Dialog>
  );
}
