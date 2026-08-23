import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ElementType;
}

export function EmptyState({ title, description, actionLabel, actionHref, icon: Icon = FolderOpen }: EmptyStateProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-8 text-center animate-in fade-in zoom-in-95 duration-300">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface mb-4">
        <Icon className="h-6 w-6 text-muted" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 mb-6 text-sm text-muted max-w-sm">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
