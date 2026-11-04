export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/shared/page-header";
import { StaffManagement } from "@/components/staff/staff-management";

export default async function StaffAccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.staffRole !== "ADMIN") redirect("/");

  const accounts = await prisma.staffAccount.findMany({
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
