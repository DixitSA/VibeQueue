// ─── GET /api/spotify/auth ────────────────────────────────────────────────────
// Redirects the admin to Spotify's Authorization Code consent page.
// Scopes required: playback state read + modify.

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

// State cookie lives just long enough for the user to complete the Spotify
// consent flow (10 minutes).
const STATE_COOKIE_MAX_AGE_SECONDS = 600;

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venueId') ?? (process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST');

  console.log(`[VibeQueue] Starting Spotify Auth for venue: ${venueId}`);

  const clientId    = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI is not configured.' },
      { status: 500 },
    );
  }

  // CSRF protection: bind a random nonce + venueId together, store it in an
  // httpOnly cookie, and require the callback to present the exact same
  // value back via the `state` param before we trust it.
  const nonce = randomUUID();
  const state = Buffer.from(JSON.stringify({ nonce, venueId })).toString('base64url');

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         SCOPES,
    state,
    show_dialog:   'false',
  });

  const response = NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );

  response.cookies.set('spotify_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
  });

  return response;
}
