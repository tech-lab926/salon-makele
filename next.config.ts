import type { NextConfig } from "next";

const extraImageHosts =
  process.env.NEXT_IMAGE_HOSTNAMES?.split(",")
    .map((h) => h.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      { source: "/blogs", destination: "/blog", permanent: true },
      { source: "/blogs/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: "/api/media/:path*" },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "cdnx.premiumread.com", pathname: "/**" },
      { protocol: "https", hostname: "www.japantimes.co.jp", pathname: "/**" },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/**" },
      ...extraImageHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
        pathname: "/**",
      })),
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prevent clickjacking in legacy browsers (CSP frame-ancestors handles modern ones).
          { key: "X-Frame-Options", value: "DENY" },
          // Enforce HTTPS for 2 years; preload-eligible.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Disable browser features that are not used by this app.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
