import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";

// Shown instantly while a page's data loads (Next.js wraps the page in <Suspense>).
export default function Loading() {
  return (
    <LoadingScreen label="Loading page">
      <Skeleton className="h-10 w-3/4 max-w-xl" />
      <Skeleton className="mt-4 h-5 w-full max-w-lg" />
      <Skeleton className="mt-2 h-5 w-2/3 max-w-md" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
    </LoadingScreen>
  );
}
