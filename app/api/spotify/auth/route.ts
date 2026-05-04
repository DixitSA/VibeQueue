// ─── GET /api/spotify/auth ────────────────────────────────────────────────────
// Redirects the admin to Spotify's Authorization Code consent page.
// Scopes required: playback state read + modify.

import { NextResponse } from 'next/server';

const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venueId') ?? (process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST');

  const clientId    = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'SPOTIFY_CLIENT_ID or SPOTIFY_REDIRECT_URI is not configured.' },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    response_type: 'code',
    redirect_uri:  redirectUri,
    scope:         SCOPES,
    // venueId in state so the callback knows which venue to update.
    // Production: replace with a signed CSRF token stored in an httpOnly cookie.
    state:         venueId,
    show_dialog:   'false',
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
}
