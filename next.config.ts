import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Now that the Next.js app is at the repository root,
  // set tracing root to the current directory.
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      {
        source: "/api/mcp/sse",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Mcp-Session-Id",
          },
        ],
      },
      {
        source: "/api/mcp/sse/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
