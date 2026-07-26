import { Skeleton } from "@/components/ui/skeleton";

export default function NotesLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-9 w-full max-w-lg" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
