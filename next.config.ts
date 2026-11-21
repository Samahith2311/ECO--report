import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scaffold enabled cacheComponents/partialPrefetching; removed to keep the classic,
  // easy-to-explain rendering model (pages are dynamic when they read cookies/DB).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
