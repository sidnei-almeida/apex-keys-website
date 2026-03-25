import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /** Home Hero usa `<img>` direto em `page.tsx` — não passa por /_next/image nem Sharp. */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.rawg.io",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "apex-keys-api-production.up.railway.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.alphacoders.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
