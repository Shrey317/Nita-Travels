import { Skeleton } from "@/components/ui/skeleton";

export default function MileageLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-9 w-full max-w-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
