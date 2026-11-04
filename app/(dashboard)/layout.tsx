import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getNotifications } from "@/lib/db/notifications";
import { NotificationsProvider } from "@/components/layout/notifications-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.staffRole === "ADMIN";
  const userName = session.user.name || (isAdmin ? "admin" : "Staff User");
  const userEmail = session.user.email || undefined;

  let initialNotifications: Awaited<ReturnType<typeof getNotifications>> = [];
  try {
    initialNotifications = await getNotifications();
  } catch (error) {
    console.error("Failed to fetch initial notifications in layout:", error);
  }

  return (
    <NotificationsProvider initialNotifications={initialNotifications}>
      <div className="flex min-h-screen bg-surface-primary">
        <Sidebar isAdmin={isAdmin} userName={userName} userEmail={userEmail} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar isAdmin={isAdmin} userName={userName} userEmail={userEmail} />
          <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </NotificationsProvider>
  );
}
