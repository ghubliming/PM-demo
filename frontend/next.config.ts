import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Configure basePath for GitHub Pages deployment
  // This will be set to /PM-demo for the production deployment
  basePath: process.env.NODE_ENV === 'production' ? '/PM-demo' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/PM-demo/' : '',
};

export default nextConfig;
