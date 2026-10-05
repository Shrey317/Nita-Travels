import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Native disclosure keeps detailed reports accessible without adding client JavaScript. */
export function DetailSection({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <details className="group/disclosure rounded-card border border-border bg-card shadow-soft">
      <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 rounded-card p-5 marker:content-none hover:bg-surface-secondary/50 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-base font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-sm text-muted">{description}</span>
        </span>
        <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-muted transition-transform group-open/disclosure:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border p-4 sm:p-5">{children}</div>
    </details>
  );
}
