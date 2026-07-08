// ─── GET /api/auth/callback/spotify ──────────────────────────────────────────
// Handles the Spotify OAuth redirect, exchanges the code for tokens,
// persists them to Firestore, and redirects back to /admin.
// This path matches the user's existing Spotify Dashboard configuration.

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

// Builds a redirect response to /admin and always clears the one-time-use
// state cookie, whether this request succeeded or failed.
function redirectAndClearState(origin: string, query: string): NextResponse {
  const response = NextResponse.redirect(`${origin}/admin${query}`);
  response.cookies.delete('spotify_oauth_state');
  return response;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  console.log('[VibeQueue] Callback route hit:', request.url);

  // CSRF protection: the `state` query param must exactly match the value we
  // stashed in the httpOnly cookie when the flow started. Reject (without
  // ever calling Spotify's token endpoint) if it's missing or mismatched.
  const stateParam  = searchParams.get('state');
  const cookieHeader = request.headers.get('cookie');
  const cookieMatch  = cookieHeader?.match(/(?:^|;\s*)spotify_oauth_state=([^;]*)/);
  const cookieState  = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  if (!stateParam || !cookieState || stateParam !== cookieState) {
    console.warn('[VibeQueue] Spotify OAuth state mismatch or missing cookie.');
    return redirectAndClearState(origin, '?error=invalid_state');
  }

  let venueId: string;
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf8'));
    venueId = decoded?.venueId ?? (process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST');
  } catch (decodeErr) {
    console.warn('[VibeQueue] Failed to decode Spotify OAuth state:', decodeErr);
    return redirectAndClearState(origin, '?error=invalid_state');
  }

  try {
    const code  = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      console.warn('[VibeQueue] Auth denied or missing code:', error);
      return redirectAndClearState(origin, '?error=spotify_denied');
    }

    const clientId     = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri  = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('[VibeQueue] Missing Spotify configuration');
      return redirectAndClearState(origin, '?error=missing_credentials');
    }

    console.log('[VibeQueue] Exchanging code for tokens...');
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
      return redirectAndClearState(origin, '?error=token_exchange_failed');
    }

    console.log(`[VibeQueue] Persisting tokens for venue: ${venueId}`);

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

    console.log('[VibeQueue] Success! Redirecting to admin...');
    return redirectAndClearState(origin, '?connected=true');

  } catch (fatalErr: unknown) {
    console.error('[VibeQueue] FATAL Callback Error:', fatalErr);
    return redirectAndClearState(origin, '?error=callback_failed');
  }
}
