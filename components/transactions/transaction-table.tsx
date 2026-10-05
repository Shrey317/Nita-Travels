"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Receipt } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatZAR, formatKm, formatMonthKey, formatVehicleLabel } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

interface TransactionTableProps {
  transactions: Transaction[];
  vehicles: { id: string; registration: string }[];
  initialEditingId?: string;
}

/** Inline edit (Dialog) and delete (AlertDialog) per row, per SRS 15.4 — no separate edit
 *  page/route exists for transactions. */
export function TransactionTable({ transactions, vehicles, initialEditingId }: TransactionTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(initialEditingId ?? null);
  const editingTransaction = transactions.find((t) => t.id === editingId);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't delete this transaction.");
    }
    window.dispatchEvent(new Event("fleet-data-changed"));
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions"
        description="No transactions match these filters. Try adjusting your date range or category."
        icon={Receipt}
      />
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden" aria-label="Transaction cards">
        {transactions.map(t => <article key={t.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{formatVehicleLabel(t.vehicleId)}</p><p className="text-xs text-muted">{formatDate(t.date)}</p></div>
          <p className="mt-2 text-sm text-muted">{CATEGORY_LABELS[t.category] ?? t.category}</p>
          <p className={`mt-2 break-words text-xl font-semibold tabular-nums ${t.incomeZarCents ? "text-status-success" : "text-ink"}`}>{t.incomeZarCents ? "+ " : "− "}{formatZAR(t.incomeZarCents || t.expenseZarCents)}</p>
          <p className="mt-1 text-xs text-muted">{t.incomeZarCents ? "Income" : "Expense"}{t.category === "Service" ? ` · ${formatKm(t.mileageKm)}` : ""}</p>
          {t.notes && <p className="mt-3 break-words text-sm text-ink-secondary">{t.notes}</p>}
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-2"><Button variant="ghost" aria-label="Edit transaction" onClick={() => setEditingId(t.id)}><Pencil aria-hidden="true" />Edit</Button><DeleteConfirmDialog title="Delete this transaction?" description={`Remove the ${CATEGORY_LABELS[t.category] ?? t.category} entry from ${formatDate(t.date)} from your active ledger and reports.`} onDelete={() => handleDelete(t.id)} successMessage="Transaction deleted" triggerLabel="Delete transaction" /></div>
        </article>)}
      </div>
      <div className="hidden md:block">
      <Table aria-label="Transactions">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortableHeader field="date">Date</SortableHeader>
            <SortableHeader field="vehicleId">Vehicle</SortableHeader>
            <SortableHeader field="category">Category</SortableHeader>
            <SortableHeader field="incomeZarCents" align="right" className="text-right">
              Income (R)
            </SortableHeader>
            <SortableHeader field="expenseZarCents" align="right" className="text-right">
              Expense (R)
            </SortableHeader>
            <SortableHeader field="mileageKm" align="right" className="text-right">
              Mileage (km)
            </SortableHeader>
            <TableHead>Notes</TableHead>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap">{formatDate(t.date)}</TableCell>
              <TableCell>{formatVehicleLabel(t.vehicleId)}</TableCell>
              <TableCell>{CATEGORY_LABELS[t.category] ?? t.category}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                {t.incomeZarCents ? formatZAR(t.incomeZarCents) : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                {t.expenseZarCents ? formatZAR(t.expenseZarCents) : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono text-sm">
                {t.category === "Service" ? formatKm(t.mileageKm) : "—"}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={t.notes ?? undefined}>
                {t.notes ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted">{formatMonthKey(t.date)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit transaction" onClick={() => setEditingId(t.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteConfirmDialog
                    title="Delete this transaction?"
                    description={`Remove the ${CATEGORY_LABELS[t.category] ?? t.category} entry from ${formatDate(t.date)} from your active ledger and reports.`}
                    onDelete={() => handleDelete(t.id)}
                    successMessage="Transaction deleted"
                    triggerLabel="Delete transaction"
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm vehicles={vehicles} transaction={editingTransaction} onClose={() => setEditingId(null)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
