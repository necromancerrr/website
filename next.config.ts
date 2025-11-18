import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Now that the Next.js app is at the repository root,
  // set tracing root to the current directory.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
