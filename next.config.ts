import type { NextConfig } from "next";
const config: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [
      ...[
        "/cart",
        "/checkout/:path*",
        "/order/:path*",
        "/api/checkout/:path*",
        "/api/order/:path*",
        "/api/download",
        "/api/stripe/:path*",
        "/api/internal/:path*",
      ].map((source) => ({
        source,
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      })),
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
