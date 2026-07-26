import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
