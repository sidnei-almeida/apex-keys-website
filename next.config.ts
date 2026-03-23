import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
