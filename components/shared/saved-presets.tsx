"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const routes = ['/vehicles', '/transactions', '/mileage', '/notes', '/repairs', '/service', '/weekly', '/monthly', '/analytics', '/reports'];
const storageKey = 'nita-report-presets-v1';
type Preset = { name: string; path: string; query: string };

function readPresets(): Preset[] {
  const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Preset => item && typeof item.name === 'string' && item.name.length <= 60 && routes.includes(item.path) && typeof item.query === 'string' && item.query.length <= 2000).slice(0, 30);
}

export function SavedPresets() {
  const pathname = usePathname();
  const query = useSearchParams();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => {
    try { setPresets(readPresets()); }
    catch { setMessage('Saved views are unavailable in this browser.'); }
  }, []);
  if (!routes.includes(pathname)) return null;

  function persist(next: Preset[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setPresets(next);
      return true;
    } catch {
      setMessage('This browser could not save your views.');
      return false;
    }
  }

  return <details className="mb-5 rounded-xl border border-border bg-card p-3">
    <summary className="cursor-pointer text-sm font-medium">Saved views</summary>
    <p className="mt-3 text-sm text-muted">Save the filters currently applied to this page. Views stay on this browser and device; date ranges remain fixed.</p>
    <form className="mt-3 flex flex-wrap gap-2" onSubmit={event => {
      event.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) { setMessage('Enter a name for this view.'); return; }
      if (presets.some(item => item.path === pathname && item.name.toLowerCase() === trimmed.toLowerCase())) {
        setMessage('A view with that name already exists on this page.'); return;
      }
      if (presets.length >= 30) { setMessage('Remove a saved view before adding another (maximum 30).'); return; }
      const params = new URLSearchParams(query.toString());
      params.delete('page'); params.delete('edit'); params.delete('txId');
      if (persist([...presets, { name: trimmed, path: pathname, query: params.toString() }])) {
        setName(''); setMessage('View saved.');
      }
    }}>
      <Input aria-label="Saved view name" placeholder="Name this view" maxLength={60} value={name} onChange={event => setName(event.target.value)} className="w-full sm:w-64" />
      <Button type="submit" variant="outline">Save current view</Button>
    </form>
    <ul className="mt-3 space-y-2">
      {presets.filter(item => item.path === pathname).map(item => <li key={item.name} className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline"><a href={`${item.path}${item.query ? `?${item.query}` : ''}`}>{item.name}</a></Button>
        <Button type="button" variant="ghost" aria-label={`Remove saved view ${item.name}`} onClick={() => {
          if (persist(presets.filter(candidate => candidate !== item))) setMessage('Saved view removed.');
        }}>Remove</Button>
      </li>)}
    </ul>
    <p role="status" className="mt-2 text-sm text-muted">{message}</p>
  </details>;
}
