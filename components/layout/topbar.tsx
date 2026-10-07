"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";

export function Topbar() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border-subtle bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Left/Center: Global Search */}
      <div className="flex flex-1 items-center">
        <button
          type="button"
          aria-label="Search vehicles, transactions, services (Ctrl K)"
          onClick={() => setCommandOpen(true)}
          className="group flex h-11 w-full max-w-[400px] items-center gap-3 rounded-[12px] border border-border-subtle bg-input/50 px-4 text-sm text-muted shadow-sm transition-all hover:border-primary/50 hover:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Search className="h-[18px] w-[18px] text-muted transition-colors group-hover:text-primary" />
          <span className="flex-1 text-left hidden sm:inline-block">Search vehicles, transactions, services...</span>
          <span className="flex-1 text-left sm:hidden">Search...</span>
          <kbd className="hidden h-6 items-center gap-1 rounded bg-surface px-2 font-mono text-[11px] font-medium text-muted border border-border-subtle sm:flex">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notifications */}
        <NotificationCenter />
        
        {/* Divider */}
        <div className="h-8 w-px bg-border-subtle mx-1 hidden sm:block" />

        {/* Profile Menu */}
        <ProfileMenu />
      </div>

      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </header>
  );
}
