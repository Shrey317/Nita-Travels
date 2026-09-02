import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

/**
 * Standardized page header used across all dashboard pages.
 * Provides consistent typography, spacing, and layout for page titles
 * with an optional right-aligned actions slot.
 */
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
