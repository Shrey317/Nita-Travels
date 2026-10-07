import { Card } from "@/components/ui/card";
import { Receipt, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { formatZAR } from "@/lib/format";
import type { Transaction } from "@prisma/client";

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="col-span-1 flex flex-col h-full bg-card border-border-subtle shadow-card-elevated">
      <div className="flex items-center justify-between border-b border-border-subtle p-5 bg-gradient-to-r from-surface-elevated/50 to-transparent">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-white tracking-tight">Recent Transactions</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transactions/new" className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Log
          </Link>
          <Link href="/transactions" className="text-xs font-medium text-muted hover:text-white">View all →</Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col divide-y divide-border-subtle overflow-y-auto max-h-[300px]">
        {transactions.slice(0, 5).map(t => (
          <Link key={t.id} href={`/transactions/${t.id}`} className="group flex items-center justify-between px-5 py-4 hover:bg-surface-elevated/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{t.vehicleId}</span>
                <span className="text-[11px] text-muted">{t.date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
              </div>
              <div className="flex flex-col ml-2">
                <span className="text-sm text-ink-secondary">{t.category}</span>
                <span className="text-[11px] text-muted max-w-[120px] truncate">{t.notes || "No notes"}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-mono-figures font-bold ${t.incomeZarCents > 0 ? 'text-status-success' : 'text-error'}`}>
                {t.incomeZarCents > 0 ? '+' : '-'}{formatZAR(t.incomeZarCents > 0 ? t.incomeZarCents : t.expenseZarCents)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
        {transactions.length === 0 && (
          <div className="p-6 flex flex-col items-center justify-center text-center h-full">
            <Receipt className="h-8 w-8 text-muted mb-2 opacity-50" />
            <p className="text-sm text-muted">No recent transactions</p>
          </div>
        )}
      </div>
    </Card>
  );
}
