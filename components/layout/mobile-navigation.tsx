"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, LayoutDashboard, Plus, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const destinations = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/mileage", label: "Mileage", icon: Gauge },
  { href: "/transactions/new", label: "Log entry", icon: Plus },
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 px-2 pt-1 backdrop-blur-lg md:hidden" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
      {destinations.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium", active ? "bg-brand-blue/10 text-brand-blue" : "text-muted hover:bg-surface-secondary hover:text-ink")}>
          <Icon className="h-5 w-5" aria-hidden="true" />{label}
        </Link>;
      })}
    </nav>
  );
}
