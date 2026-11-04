import { Suspense, type ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SavedPresets } from "@/components/shared/saved-presets";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Topbar } from "@/components/layout/topbar";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { ConnectionStatus } from "@/components/layout/connection-status";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.staffRole === "ADMIN";
  const userName = session.user.name || (isAdmin ? "admin" : "Staff User");
  const userEmail = session.user.email || undefined;

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-teal focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>
      <Sidebar isAdmin={isAdmin} userName={userName} userEmail={userEmail} />
      <div className="min-w-0 flex-1 flex flex-col">
        <Topbar isAdmin={isAdmin} userName={userName} userEmail={userEmail} />
        <ConnectionStatus />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-28 outline-none sm:px-6 md:pb-8 lg:px-8">
          <Suspense fallback={null}><SavedPresets /></Suspense>
          {children}
        </main>
      </div>
      <Toaster />
      <MobileNavigation />
    </div>
  );
}
