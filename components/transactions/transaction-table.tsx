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
        {transactions.map(t => <article key={t.id} className="rounded-xl border border-border-subtle bg-card p-4 shadow-card-elevated">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-bold text-white">{formatVehicleLabel(t.vehicleId)}</p><p className="text-xs text-muted">{formatDate(t.date)}</p></div>
          <p className="mt-2 text-sm text-ink-secondary">
            <span className="inline-flex items-center rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold border border-border-subtle">
              {CATEGORY_LABELS[t.category] ?? t.category}
            </span>
          </p>
          <p className={`mt-2 break-words text-xl font-bold font-mono-figures ${t.incomeZarCents ? "text-status-success" : "text-white"}`}>{t.incomeZarCents ? "+ " : "− "}{formatZAR(t.incomeZarCents || t.expenseZarCents)}</p>
          <p className="mt-1 text-xs text-muted">{t.incomeZarCents ? "Income" : "Expense"}{t.category === "Service" ? ` · ${formatKm(t.mileageKm)}` : ""}</p>
          {t.notes && <p className="mt-3 break-words text-sm text-ink-secondary">{t.notes}</p>}
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-border-subtle pt-2"><Button variant="ghost" aria-label="Edit transaction" onClick={() => setEditingId(t.id)}><Pencil aria-hidden="true" />Edit</Button><DeleteConfirmDialog title="Delete this transaction?" description={`Remove the ${CATEGORY_LABELS[t.category] ?? t.category} entry from ${formatDate(t.date)} from your active ledger and reports.`} onDelete={() => handleDelete(t.id)} successMessage="Transaction deleted" triggerLabel="Delete transaction" /></div>
        </article>)}
      </div>
      <div className="hidden md:block">
      <div className="rounded-xl border border-border-subtle bg-card overflow-hidden shadow-card-elevated">
      <Table aria-label="Transactions">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-surface-elevated/50">
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
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Notes</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Month</TableHead>
            <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border-subtle">
          {transactions.map((t) => (
            <TableRow key={t.id} className="hover:bg-surface-elevated/50 transition-colors">
              <TableCell className="whitespace-nowrap text-ink-secondary">{formatDate(t.date)}</TableCell>
              <TableCell className="font-bold text-white">{formatVehicleLabel(t.vehicleId)}</TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-ink-secondary border border-border-subtle">
                  {CATEGORY_LABELS[t.category] ?? t.category}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono-figures text-sm">
                {t.incomeZarCents ? <span className="text-status-success font-semibold">{formatZAR(t.incomeZarCents)}</span> : <span className="text-muted">—</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono-figures text-sm">
                {t.expenseZarCents ? <span className="text-error font-semibold">{formatZAR(t.expenseZarCents)}</span> : <span className="text-muted">—</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono-figures text-sm text-ink-secondary">
                {t.category === "Service" ? formatKm(t.mileageKm) : "—"}
              </TableCell>
              <TableCell className="max-w-xs truncate text-ink-secondary" title={t.notes ?? undefined}>
                {t.notes ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted">{formatMonthKey(t.date)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit transaction" onClick={() => setEditingId(t.id)} className="text-muted hover:text-white hover:bg-surface-elevated">
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
