'use server';

// ─── Spotify Server Action ────────────────────────────────────────────────────
// Uses the Client Credentials OAuth flow — no user login required.
// Secrets stay server-side (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET).
// NEXT_PUBLIC_ prefix is intentionally NOT used here.

import type { SpotifyTrack } from '@/types';

// ── Token helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches a Client Credentials access token from Spotify.
 * Next.js's extended `fetch` caches the response for 50 minutes so we don't
 * hit the token endpoint on every search.  The token itself is valid for 60
 * minutes, giving us a 10-minute safety buffer.
 */
async function getSpotifyToken(): Promise<string> {
  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      '[VibeQueue] Spotify credentials missing. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.',
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
    // Cache token for 50 min (well within the 60-min Spotify token lifetime)
    next: { revalidate: 3000 },
  });

  if (!res.ok) {
    throw new Error(`[VibeQueue] Spotify token fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Raw Spotify API types (internal) ──────────────────────────────────────────

interface RawSpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    images: Array<{ url: string; width: number; height: number }>;
  };
}

// ── Public Server Action ───────────────────────────────────────────────────────

/**
 * Searches Spotify for tracks matching `query`.
 * Returns the top 5 results shaped into our internal SpotifyTrack type.
 *
 * Called directly from Client Components via Next.js Server Actions.
 */
export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  if (!query.trim()) return [];

  const token = await getSpotifyToken();

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', '5');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    // Do NOT cache search results — each query is unique
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error(`[VibeQueue] Spotify search error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  const items: RawSpotifyTrack[] = data.tracks?.items ?? [];

  return items.map((item) => ({
    id:       item.id,
    title:    item.name,
    artist:   item.artists.map((a) => a.name).join(', '),
    // Prefer the 300×300 image (index 1); fall back to largest (index 0) or empty
    albumArt: item.album.images[1]?.url ?? item.album.images[0]?.url ?? '',
  }));
}
