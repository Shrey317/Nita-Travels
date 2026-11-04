export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensureStaffAccountTable, prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { StaffManagement, type StaffAccountItem } from "@/components/staff/staff-management";

export default async function StaffAccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.staffRole !== "ADMIN") redirect("/");

  let accounts: StaffAccountItem[] = [];
  try {
    await ensureStaffAccountTable();
    accounts = await prisma.staffAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Failed to load staff accounts:", {
      kind: error instanceof Error ? error.name : "UNKNOWN",
    });
    accounts = [];
  }

  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Access"
        description="Create and manage staff user accounts. Regular users can add new entries and view fleet data, while only the Administrator can edit or delete records."
      />
      <StaffManagement initialAccounts={accounts} adminUsername={adminUsername} />
    </div>
  );
}
