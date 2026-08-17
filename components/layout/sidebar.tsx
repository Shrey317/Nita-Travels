"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X, LogOut, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { signOutAction } from "@/app/(dashboard)/actions";

function NavLinks({ onNavigate, alwaysShowLabel = false }: { onNavigate?: () => void; alwaysShowLabel?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-6 px-3" aria-label="Main navigation">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          <div className={cn("px-3 text-xs font-semibold tracking-wider text-slate-500", alwaysShowLabel ? "block" : "hidden lg:block")}>
            {group.label}
          </div>
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light",
                  active
                    ? "bg-teal/15 font-medium text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-0.5"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-light shadow-glow" />
                )}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={cn("truncate", alwaysShowLabel ? "inline" : "hidden lg:inline")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function SignOutButton({ alwaysShowLabel = false }: { alwaysShowLabel?: boolean }) {
  return (
    <form action={signOutAction} className="px-3 pt-3">
      <div className="mb-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <button
        type="submit"
        aria-label="Sign Out"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
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
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-navy to-navy-light px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/20">
              <Truck className="h-4 w-4 text-teal-light" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">NITA TRAVELS</span>
          </div>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DialogPrimitive.Trigger>
        </div>

        {/* Mobile drawer — Radix traps focus inside while open, closes on Escape or an outside
         *  click, and returns focus to the trigger button above on close (SRS a11y: keyboard
         *  users can never tab out to content hidden behind the overlay). */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm md:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gradient-to-b from-navy via-navy to-navy-light py-4 outline-none data-[state=open]:animate-slide-in-left md:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal/20">
                  <Truck className="h-4 w-4 text-teal-light" />
                </div>
                <span className="text-sm font-semibold text-white">NITA TRAVELS</span>
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogPrimitive.Close>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} alwaysShowLabel />
            <SignOutButton alwaysShowLabel />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Desktop (240px, full labels) / tablet (icon-only) sidebar */}
      <aside className="hidden shrink-0 flex-col bg-gradient-to-b from-navy via-navy to-navy-light py-4 md:flex md:w-16 lg:w-60">
        <div className="mb-6 px-3">
          {/* Desktop: logo + name + theme toggle */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/20">
              <Truck className="h-4 w-4 text-teal-light" />
            </div>
            <span className="flex-1 text-sm font-semibold tracking-tight text-white">NITA TRAVELS</span>
          </div>
          {/* Tablet: icon-only logo + theme toggle stacked */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal/20">
              <Truck className="h-4 w-4 text-teal-light" aria-hidden="true" />
            </div>
          </div>
        </div>
        <NavLinks />
        <div className="mt-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  );
}
