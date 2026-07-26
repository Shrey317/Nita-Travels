export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/client";
import { TransactionForm } from "@/components/transactions/transaction-form";

export default async function NewTransactionPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { active: true },
    select: { id: true, registration: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Transaction</h1>
        <p className="text-sm text-muted">Record income, an expense, or a service event.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <TransactionForm vehicles={vehicles} />
      </div>
    </div>
  );
}
