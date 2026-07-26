"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { SortableHeader } from "@/components/shared/sortable-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatDate, formatZAR, formatKm, formatMonthKey, formatVehicleLabel } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Transaction } from "@prisma/client";

interface TransactionTableProps {
  transactions: Transaction[];
  vehicles: { id: string; registration: string }[];
}

/** Inline edit (Dialog) and delete (AlertDialog) per row, per SRS 15.4 — no separate edit
 *  page/route exists for transactions. */
export function TransactionTable({ transactions, vehicles }: TransactionTableProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTransaction = transactions.find((t) => t.id === editingId);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Couldn't delete this transaction.");
    }
    router.refresh();
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted">
        No transactions match these filters.
      </div>
    );
  }

  return (
    <>
      <Table>
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
              <TableCell className="text-right font-mono text-sm">
                {t.incomeZarCents ? formatZAR(t.incomeZarCents) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {t.expenseZarCents ? formatZAR(t.expenseZarCents) : "—"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
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
                    description={`This permanently removes the ${CATEGORY_LABELS[t.category] ?? t.category} entry from ${formatDate(t.date)}. This can't be undone.`}
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
