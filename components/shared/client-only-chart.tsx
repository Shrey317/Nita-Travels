"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Recharts' <ResponsiveContainer> measures its parent element via the browser's layout/
 * ResizeObserver APIs, which don't exist during server rendering. Rendered as part of the
 * initial server-rendered HTML (as all three chart components here are, from async Server
 * Component pages), it comes down the wire as an empty <div> with no <svg> inside at all, and —
 * this is the well-documented, recurring part (e.g. recharts/recharts#3595, #4586, and a long
 * history of "chart renders blank in Next.js" reports) — filling itself in client-side after
 * hydration isn't fully reliable, so the chart can stay empty indefinitely instead of just
 * flashing blank for a moment.
 *
 * This wrapper sidesteps the whole failure class rather than chasing one specific trigger:
 * `children` (the <ResponsiveContainer> and everything inside it) is only ever rendered client-
 * side, after mount, so it's never part of the server-rendered HTML and always measures a real,
 * already-painted DOM node the first time it runs.
 */
export function ClientOnlyChart({ className, children }: { className: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={`${className} flex items-center justify-center text-sm text-muted`} aria-hidden="true">
        Loading chart…
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
