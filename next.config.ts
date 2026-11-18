import type { NextConfig } from "next";

/**
 * Dev only: when set, API and upload requests are proxied from this origin to the live backend.
 * The browser then only ever talks to localhost, so CORS never applies — the live API's allow-list
 * holds the deployed panel's origin and nothing else. Unset in production, where the panel is
 * served from an allowed origin and calls the API directly.
 */
const proxyTarget = process.env.DEV_API_PROXY_TARGET?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    if (!proxyTarget) return [];
    return {
      beforeFiles: [],
      // After the filesystem, so this app's own /api/* routes still win over the proxy.
      afterFiles: [
        { source: "/api/:path*", destination: `${proxyTarget}/api/:path*` },
        { source: "/public/:path*", destination: `${proxyTarget}/public/:path*` },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
