import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  // Hide the Next.js dev indicator (bottom-left "N" logo) in development
  devIndicators: false,
};

export default nextConfig;
