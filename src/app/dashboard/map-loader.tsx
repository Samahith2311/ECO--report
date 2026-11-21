"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window` when imported, so the map must never render on the server.
const ComplaintMap = dynamic(() => import("./complaint-map"), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse rounded-xl bg-brand-50" />,
});

export default ComplaintMap;
