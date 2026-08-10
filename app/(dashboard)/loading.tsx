import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" style={{ animationDelay: "400ms" }} />
      <Skeleton className="h-64 rounded-xl" style={{ animationDelay: "500ms" }} />
    </div>
  );
}
