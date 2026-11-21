import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";

// Dashboard-shaped placeholder: stat cards, then chart cards.
export default function Loading() {
  return (
    <LoadingScreen label="Loading dashboard">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </LoadingScreen>
  );
}
