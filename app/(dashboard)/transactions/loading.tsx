import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Skeleton className="h-9 w-full max-w-2xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
