"use client";

import { Suspense, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableHeaderProps {
  field: string;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}

function SortableHeaderInner({ field, children, className, align = "left" }: SortableHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy") ?? "date";
  const currentSortDir = searchParams.get("sortDir") ?? "desc";
  const isActive = currentSortBy === field;

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortDir", isActive && currentSortDir === "desc" ? "asc" : "desc");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const Icon = !isActive ? ArrowUpDown : currentSortDir === "desc" ? ArrowDown : ArrowUp;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Sort by ${typeof children === "string" ? children : field}`}
        className={cn(
          "inline-flex items-center gap-1 rounded text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light",
          isActive ? "text-white" : "text-white/80",
          align === "right" && "flex-row-reverse"
        )}
      >
        {children}
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      </button>
    </TableHead>
  );
}

/** SRS 15.4 is explicit that the Transactions table is "sortable" — the only table in the spec
 *  described that way, so unlike every other table's fixed default order, this one needs real
 *  clickable-header interactivity. Self-wrapped in Suspense per the usual useSearchParams()
 *  requirement. */
export function SortableHeader(props: SortableHeaderProps) {
  return (
    <Suspense fallback={<TableHead className={props.className}>{props.children}</TableHead>}>
      <SortableHeaderInner {...props} />
    </Suspense>
  );
}
