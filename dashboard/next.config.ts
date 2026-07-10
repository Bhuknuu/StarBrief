import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker / optimized system deployments
  output: "standalone",
  // Disable x-powered-by for security
  poweredByHeader: false,
  // Strict mode for better React 19 safety
  reactStrictMode: true,
};

export default nextConfig;
