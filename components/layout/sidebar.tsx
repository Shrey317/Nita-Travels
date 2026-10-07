"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useFleetNotifications } from "@/lib/hooks/use-fleet-notifications";
import { Menu, X, LogOut, CarFront, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/components/layout/nav-config";
import { signOutAction } from "@/app/(dashboard)/actions";

function NavLinks({ onNavigate, isCollapsed = false }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  const pathname = usePathname();
  const { data: notifications = [] } = useFleetNotifications();
  const count = (category: string) => new Set(notifications.filter(item => item.category === category && item.priority !== "info").map(item => item.vehicleId)).size;
  const badges = { serviceCount: count("service"), mileageCount: count("mileage"), alertCount: count("system") };
  
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 custom-scrollbar" aria-label="Main navigation">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1">
          {!isCollapsed && (
            <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-[#728199]">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={isCollapsed ? item.label : undefined}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  active
                    ? "bg-gradient-to-r from-primary/20 to-transparent text-white"
                    : "text-muted hover:bg-white/5 hover:text-white",
                  isCollapsed && "justify-center px-0"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_rgba(47,107,255,0.5)]" />
                )}
                
                <Icon className={cn("shrink-0 transition-colors", active ? "text-primary" : "text-muted group-hover:text-white", isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]")} aria-hidden="true" />
                
                {!isCollapsed && <span className="truncate flex-1">{item.label}</span>}
                
                {/* Badges */}
                {!isCollapsed && item.href === "/service" && badges?.serviceCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-white shadow-sm">
                    {badges.serviceCount}
                  </span>
                )}
                {!isCollapsed && item.href === "/mileage" && badges?.mileageCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-[#050A14] shadow-sm">
                    {badges.mileageCount}
                  </span>
                )}
                {!isCollapsed && item.href === "/alerts" && badges?.alertCount > 0 && (
                  <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-white shadow-sm">
                    {badges.alertCount}
                  </span>
                )}
                
                {/* Collapsed dot indicators */}
                {isCollapsed && item.href === "/service" && badges?.serviceCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-error" />
                )}
                {isCollapsed && item.href === "/mileage" && badges?.mileageCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-warning" />
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ isCollapsed = false }: { isCollapsed?: boolean }) {
  return (
    <div className="border-t border-border-subtle p-4">
      <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-elevated border border-border-subtle shadow-sm">
          <User className="h-5 w-5 text-muted" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-ink">admin</span>
            <span className="truncate text-xs text-muted">Administrator</span>
          </div>
        )}
      </div>
      <form action={signOutAction} className={cn("mt-4", isCollapsed && "flex justify-center")}>
        <button
          type="submit"
          aria-label="Sign Out"
          className={cn(
            "flex h-10 items-center gap-2 rounded-xl text-sm font-medium text-muted transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isCollapsed ? "w-10 justify-center" : "w-full px-3"
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </form>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed] = useState(false);

  return (
    <>
      <DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        {/* Mobile top bar */}
        <div className="flex h-[72px] items-center justify-between border-b border-border-subtle bg-surface-sidebar px-4 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-bright-blue shadow-soft">
              <CarFront className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-white leading-tight">Nita Travels</div>
              <div className="text-[10px] font-medium text-soft-blue leading-tight">Fleet Management System</div>
            </div>
          </div>
          <DialogPrimitive.Trigger asChild>
            <button
              type="button"
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Menu className="h-5 w-5" />
            </button>
          </DialogPrimitive.Trigger>
        </div>

        {/* Mobile drawer */}
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface-sidebar shadow-2xl outline-none data-[state=open]:animate-slide-in-left md:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <div className="flex h-[72px] items-center justify-between border-b border-border-subtle px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-bright-blue shadow-soft">
                  <CarFront className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-[15px] font-bold tracking-tight text-white leading-tight">Nita Travels</div>
                  <div className="text-[10px] font-medium text-soft-blue leading-tight">Fleet Management System</div>
                </div>
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogPrimitive.Close>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
            <UserBlock />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Desktop sidebar */}
      <aside 
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border-subtle bg-surface-sidebar transition-all duration-300 md:flex",
          isCollapsed ? "w-[80px]" : "w-[260px]"
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center border-b border-border-subtle px-4">
          <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "justify-center w-full")}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-primary to-bright-blue shadow-[0_0_15px_rgba(47,107,255,0.3)]">
              <CarFront className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap animate-fade-in">
                <span className="text-[15px] font-bold tracking-tight text-white leading-tight">Nita Travels</span>
                <span className="text-[10px] font-medium text-soft-blue leading-tight">Fleet Management System</span>
              </div>
            )}
          </div>
        </div>
        
        <NavLinks isCollapsed={isCollapsed} />
        <UserBlock isCollapsed={isCollapsed} />
        
        {/* Toggle Collapse Button (Optional, can be added if requested) */}
      </aside>
    </>
  );
}
