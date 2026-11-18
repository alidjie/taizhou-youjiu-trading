import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The shared Tailwind stylesheet is small; inline it to remove the
    // render-blocking CSS round trip on first visits.
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "fsqpeuulaglnnwfyxndj.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { fs: false, path: false };
    }
    return config;
  },
};

export default nextConfig;
