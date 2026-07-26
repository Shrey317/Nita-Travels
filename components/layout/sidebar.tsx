"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { signOutAction } from "@/app/(dashboard)/actions";

function NavLinks({ onNavigate, alwaysShowLabel = false }: { onNavigate?: () => void; alwaysShowLabel?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light",
              active ? "bg-teal font-medium text-white" : "bg-navy text-slate-300 hover:bg-navy-light hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className={cn("truncate", alwaysShowLabel ? "inline" : "hidden lg:inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutButton({ alwaysShowLabel = false }: { alwaysShowLabel?: boolean }) {
  return (
    <form action={signOutAction} className="border-t border-navy-light px-3 pt-3">
      <button
        type="submit"
        aria-label="Sign Out"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-navy-light hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className={cn(alwaysShowLabel ? "inline" : "hidden lg:inline")}>Sign Out</span>
      </button>
    </form>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-navy-light bg-navy px-4 py-3 md:hidden">
        <span className="text-sm font-semibold tracking-tight text-white">NITA TRAVELS</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-md p-2 text-white hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-navy py-4">
            <div className="flex items-center justify-between px-4 pb-4">
              <span className="text-sm font-semibold text-white">NITA TRAVELS</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-md p-2 text-white hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} alwaysShowLabel />
            <SignOutButton alwaysShowLabel />
          </div>
        </div>
      )}

      {/* Desktop (240px, full labels) / tablet (icon-only) sidebar */}
      <aside className="hidden shrink-0 flex-col bg-navy py-4 md:flex md:w-16 lg:w-60">
        <div className="mb-4 px-3">
          <span className="hidden text-sm font-semibold tracking-tight text-white lg:block">NITA TRAVELS</span>
          <span className="block text-center text-sm font-bold text-white lg:hidden" aria-hidden="true">
            NT
          </span>
        </div>
        <NavLinks />
        <div className="mt-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
