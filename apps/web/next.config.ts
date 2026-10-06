/** Next.js config: standalone output for the Docker image; internal packages are compiled from source. */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: new URL("../..", import.meta.url).pathname,
  transpilePackages: [
    "@tafsila/api",
    "@tafsila/ui",
    "@tafsila/engine",
    "@tafsila/schemas",
    "@tafsila/utils",
    "@tafsila/config",
  ],
  poweredByHeader: false,
};

export default nextConfig;
