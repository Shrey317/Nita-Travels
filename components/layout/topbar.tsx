"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { NAV_GROUPS } from "./nav-config";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { ProfileMenu } from "./profile-menu";

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [{ label: "Nita Travels", href: "/" }];

  for (const group of NAV_GROUPS) {
    const found = group.items.find((i) =>
      i.href !== "/" ? pathname.startsWith(i.href) : pathname === "/"
    );
    if (found) {
      crumbs.push({ label: found.label, href: found.href });
      break;
    }
  }

  // Vehicle sub-pages: /vehicles/CR01 → Vehicles → CR01
  const vehicleMatch = pathname.match(/^\/vehicles\/([A-Z0-9]+)/);
  if (vehicleMatch?.[1] && vehicleMatch[1] !== "new") {
    crumbs.push({ label: vehicleMatch[1] });
  }

  // /vehicles/new
  if (pathname === "/vehicles/new") {
    crumbs.push({ label: "New Vehicle" });
  }

  // /transactions/new or /transactions/:id
  if (pathname === "/transactions/new") {
    crumbs.push({ label: "New Transaction" });
  }

  // /mileage/new
  if (pathname === "/mileage/new") {
    crumbs.push({ label: "New Entry" });
  }

  return crumbs;
}

export function Topbar() {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted/50" aria-hidden="true" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-ink" aria-current="page">{crumb.label}</span>
              ) : (
                <a href={crumb.href} className="hidden sm:inline hover:text-ink transition-colors">
                  {i === 0 ? <span className="hidden md:inline">{crumb.label}</span> : crumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted hover:border-brand-blue/50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline-block">Search...</span>
          <kbd className="hidden rounded bg-surface px-1.5 font-mono text-[10px] sm:inline-block border border-border">
            Ctrl K
          </kbd>
        </button>

        {/* Notifications — real, data-driven */}
        <NotificationCenter />

        {/* Profile Menu — functional dropdown */}
        <ProfileMenu />
      </div>

      <CommandPalette open={commandOpen} setOpen={setCommandOpen} />
    </header>
  );
}
