import { parsePageListQuery } from "@/lib/query-filters";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus } from "lucide-react";
import { getTransactions } from "@/lib/db/transactions";
import { prisma } from "@/lib/db/client";
import { isAdminSession } from "@/lib/api-response";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Pagination } from "@/components/shared/pagination";
import { vehicleIdOptions } from "@/components/shared/vehicle-options";
import { PageHeader } from "@/components/shared/page-header";
import { DEFAULT_PAGE_SIZE, FLEET_WIDE_VEHICLE_ID } from "@/lib/constants";

interface TransactionsPageProps {
  searchParams: Promise<{
    vehicleId?: string | string[];
    category?: string | string[];
    type?: "income" | "expense" | "all";
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    edit?: string;
  }>;
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const searchParams = await props.searchParams;
  const { filters, error: filterError } = parsePageListQuery(searchParams);
  const vehicleId = filters.vehicleId ?? [];
  const category = filters.category ?? [];
  const type = filters.type ?? "all";
  const page = filters.page;

  const [isAdmin, vehicles, result] = await Promise.all([
    isAdminSession(),
    prisma.vehicle.findMany({ where: { active: true, deletedAt: null }, select: { id: true, registration: true }, orderBy: { id: "asc" } }),
    getTransactions({
      vehicleId: vehicleId.length ? vehicleId : undefined,
      category: category.length ? category : undefined,
      type,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page,
      limit: DEFAULT_PAGE_SIZE,
    }),
  ]);

  const vehicleOptions = [
    ...vehicleIdOptions(vehicles),
    { value: FLEET_WIDE_VEHICLE_ID, label: "All Vehicles / Fleet-Wide" },
  ];

  return (
    <div className="space-y-6">
      {filterError && <p role="alert" className="rounded-lg border border-status-error p-4 text-status-error">{filterError}</p>}
      <PageHeader title="Transactions" description={`${result.total} records matching filters`}>
        <Button asChild>
          <Link href="/transactions/new">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Link>
        </Button>
      </PageHeader>

      <TransactionFilters vehicleOptions={vehicleOptions} />
      <TransactionTable
        transactions={result.items}
        vehicles={vehicles}
        initialEditingId={isAdmin ? searchParams.edit : undefined}
        isAdmin={isAdmin}
      />
      <Pagination page={result.page} limit={result.limit} total={result.total} />
    </div>
  );
}
