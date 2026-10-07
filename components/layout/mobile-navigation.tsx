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
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border-subtle bg-surface/95 px-2 pt-1 pb-1 backdrop-blur-xl md:hidden" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      {destinations.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === href : pathname.startsWith(href);
        return (
          <Link 
            key={href} 
            href={href} 
            aria-current={active ? "page" : undefined} 
            className={cn(
              "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[12px] text-xs font-medium transition-colors", 
              active ? "text-primary" : "text-muted hover:text-white"
            )}
          >
            <Icon className="h-[20px] w-[20px]" aria-hidden="true" />
            <span className="text-[10px]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
