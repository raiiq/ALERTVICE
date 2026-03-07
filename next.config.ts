import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent globe.gl and three from being bundled on the server
      config.externals = [
        ...(config.externals || []),
        "globe.gl",
        "three",
      ];
    }
    return config;
  },
};

export default nextConfig;
