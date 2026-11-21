"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Leaflet touches `window` when imported, so the map must never render on the server.
const ComplaintMap = dynamic(() => import("./complaint-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
});

export default ComplaintMap;
