"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, Bell, ChevronRight, User } from "lucide-react";
import { NAV_GROUPS } from "./nav-config";
import { ThemeToggle } from "./theme-toggle";
import { CommandPalette } from "./command-palette";

export function Topbar() {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  
  // Find current label
  let currentLabel = "Dashboard";
  for (const group of NAV_GROUPS) {
    const found = group.items.find(i => i.href !== "/" ? pathname.startsWith(i.href) : pathname === "/");
    if (found) {
      currentLabel = found.label;
      break;
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="hidden sm:inline">Nita Travels</span>
        <ChevronRight className="hidden h-4 w-4 sm:block" />
        <span className="font-medium text-ink">{currentLabel}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search Stub */}
        <button onClick={() => setCommandOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted hover:border-teal/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light transition-colors">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline-block">Search...</span>
          <kbd className="hidden rounded bg-surface px-1.5 font-mono text-[10px] sm:inline-block border border-border">Ctrl K</kbd>
        </button>

        {/* Notifications Stub */}
        <button className="relative rounded-full p-2 text-muted hover:bg-card hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DC2626] shadow-[0_0_0_2px_rgb(var(--color-surface))]" />
        </button>

        <ThemeToggle />

        {/* Profile Menu Stub */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal/10 text-teal-dark dark:text-teal-light ml-1 cursor-pointer hover:bg-teal/20 transition-colors border border-teal/20">
          <User className="h-4 w-4" />
        </div>
      </div>
      
      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </header>
  );
}
