import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicit root required in Next.js 16 when Turbopack can't auto-detect it.
    // Points to the directory containing package.json.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
