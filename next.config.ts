import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@supabase\/realtime-js/, message: /Critical dependency/ },
    ];
    return config;
  },
};

export default nextConfig;
