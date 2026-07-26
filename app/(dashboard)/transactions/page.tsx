export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { getTransactions } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Pagination } from "@/components/shared/pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { toStringArray } from "@/lib/utils";

interface TransactionsPageProps {
  searchParams: {
    vehicleId?: string | string[];
    category?: string | string[];
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: string;
    sortBy?: string;
    sortDir?: string;
  };
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const vehicleId = toStringArray(searchParams.vehicleId);
  const category = toStringArray(searchParams.category);
  const page = Number(searchParams.page ?? "1") || 1;

  const [vehicles, result] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getTransactions({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      category: category.length ? category : undefined,
      dateFrom: searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined,
      dateTo: searchParams.dateTo ? new Date(searchParams.dateTo) : undefined,
      search: searchParams.search || undefined,
      page,
      limit: DEFAULT_PAGE_SIZE,
      sortBy: searchParams.sortBy,
      sortDir: searchParams.sortDir === "asc" ? "asc" : "desc",
    }),
  ]);

  const exportParams = new URLSearchParams();
  for (const v of vehicleId) exportParams.append("vehicleId", v);
  for (const c of category) exportParams.append("category", c);
  if (searchParams.dateFrom) exportParams.set("dateFrom", searchParams.dateFrom);
  if (searchParams.dateTo) exportParams.set("dateTo", searchParams.dateTo);
  if (searchParams.search) exportParams.set("search", searchParams.search);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Transactions</h1>
          <p className="text-sm text-muted">{result.total} total</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/api/transactions/export?${exportParams.toString()}`}>
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      <TransactionFilters vehicles={vehicles} />
      <TransactionTable transactions={result.items} vehicles={vehicles} />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
