// ─── GET /api/spotify/callback ────────────────────────────────────────────────
// Handles the Spotify OAuth redirect, exchanges the code for tokens,
// persists them to Firestore, and redirects back to /admin.

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);

  const code    = searchParams.get('code');
  const venueId = searchParams.get('state') ?? (process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST');
  const error   = searchParams.get('error');

  // User denied permission
  if (error || !code) {
    return NextResponse.redirect(`${origin}/admin?error=spotify_denied`);
  }

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri  = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${origin}/admin?error=missing_credentials`);
  }

  // Exchange authorization code for access + refresh tokens
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:  `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type:   'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  });

  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    console.error('[VibeQueue] Token exchange failed:', tokenData);
    return NextResponse.redirect(`${origin}/admin?error=token_exchange_failed`);
  }

  // 1. Persist sensitive tokens to private vault
  await adminDb.collection('venue_secrets').doc(venueId).set({
    spotifyAccessToken:  tokenData.access_token,
    spotifyRefreshToken: tokenData.refresh_token,
    tokenExpiresAt:      new Date(Date.now() + tokenData.expires_in * 1000),
  }, { merge: true });

  // 2. Persist public connection flag to public settings
  await adminDb.collection('venue_settings').doc(venueId).set({
    spotifyConnected: true,
  }, { merge: true });

  return NextResponse.redirect(`${origin}/admin?connected=true`);
}
