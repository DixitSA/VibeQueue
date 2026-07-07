import type { NextConfig } from "next";

// ─── Security headers ──────────────────────────────────────────────────────────
// Applied to every route via the headers() hook below. The CSP's connect-src
// covers Firebase/Firestore (client SDK talks to *.googleapis.com and the
// realtime *.firebaseio.com endpoints) and Spotify (token + Web API calls made
// from lib/spotify.ts run server-side, but the admin dashboard also polls
// Spotify endpoints from the client for now-playing/device state).
// img-src mirrors the remotePatterns hosts configured below for next/image,
// plus 'self'/data: for locally-served and inlined images.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: images.unsplash.com i.scdn.co mosaic.scdn.co lineup-images.scdn.co",
  "font-src 'self' data:",
  "connect-src 'self' *.googleapis.com *.firebaseio.com accounts.spotify.com api.spotify.com",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Ignored by browsers over plain HTTP (dev), enforced over HTTPS (prod).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
