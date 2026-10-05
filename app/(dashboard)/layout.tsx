import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Topbar } from "@/components/layout/topbar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ConnectionStatus } from "@/components/layout/connection-status";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar />
        <ConnectionStatus />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-28 outline-none sm:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>
      <Toaster />
      <MobileNavigation />
    </div>
  );
}
