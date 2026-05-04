import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Tell Turbopack the project root is this directory, not the parent folder.
    // Silences the "multiple lockfiles" workspace warning.
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Spotify album art CDNs — added for Spotify Web API integration
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'lineup-images.scdn.co',
      },
    ],
  },
};

export default nextConfig;
