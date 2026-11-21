import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";

// Admin table placeholder: filters, then rows.
export default function Loading() {
  return (
    <LoadingScreen label="Loading complaints">
      <Skeleton className="h-10 w-56" />
      <div className="mt-6 flex flex-wrap gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-11 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </LoadingScreen>
  );
}
