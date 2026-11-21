import { LoadingScreen, Skeleton } from "@/components/ui/skeleton";

// Complaint detail placeholder: details card beside the actions panel.
export default function Loading() {
  return (
    <LoadingScreen label="Loading complaint">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-4 h-10 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-card lg:col-span-2" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    </LoadingScreen>
  );
}
