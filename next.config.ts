import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Isolate browser-test servers from the normal development/build output.
  distDir: process.env.KALKULATE_BUILD_DIR || ".next",
};

export default nextConfig;
