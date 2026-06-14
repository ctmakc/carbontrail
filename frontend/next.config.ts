import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Produce a self-contained build (.next/standalone/server.js) for slim Docker images
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8902"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
