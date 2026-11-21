import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";

// Track-shaped placeholder: search bar, then the complaint card and timeline.
export default function Loading() {
  return (
    <LoadingScreen label="Looking up complaint">
      <div className="mx-auto max-w-2xl">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <Skeleton className="mt-8 h-12 w-full" />
        <Skeleton className="mt-8 h-48 rounded-card" />
        <Skeleton className="mt-6 h-64 rounded-card" />
      </div>
    </LoadingScreen>
  );
}
