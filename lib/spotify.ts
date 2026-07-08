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

// ── Bar-search result cleanup ──────────────────────────────────────────────────
//
// This app runs in Spotify's Development Mode, so track objects don't include
// `popularity` — we can't sort by that. Spotify's own relevance search is
// still solid at fuzzy-matching typos (a patron typing "brittny spears
// toxic" reliably gets the real "Toxic" as a top hit), but the raw top-5
// often gets padded with remixes, freestyles, and totally unrelated tracks
// that happen to share a word. Over-fetch a larger pool and clean it up
// before handing back only 5, rather than trusting Spotify's raw order.

// NOTE: this app runs under Spotify's Development Mode quota, which caps
// /v1/search's `limit` at 10 (not the documented max of 50) — confirmed by
// testing directly against the API (limit=15+ returns a 400 "Invalid limit").
const SEARCH_FETCH_LIMIT = 10;
const RESULTS_RETURNED = 5;

// Variant/noise markers that rarely match what someone asking for "that
// song" actually wants, unless they typed the word themselves.
const NOISE_PATTERN = /\b(remix|freestyle|slowed|sped[\s-]?up|nightcore|karaoke|tribute|instrumental|mashup|8d\s*audio|tiktok|reverb)\b/i;

function normalizeKey(title: string, artist: string): string {
  return `${title}|${artist}`.toLowerCase().replace(/[^a-z0-9|]/g, '');
}

/**
 * Filters obvious noise variants (unless the patron explicitly searched for
 * one) and drops duplicate title+artist matches, preserving Spotify's
 * original relevance order among what's left.
 */
function cleanUpResults(items: RawSpotifyTrack[], query: string): RawSpotifyTrack[] {
  const queryAskedForVariant = NOISE_PATTERN.test(query);
  const seen = new Set<string>();
  const clean: RawSpotifyTrack[] = [];
  const noisy: RawSpotifyTrack[] = [];

  for (const item of items) {
    const artist = item.artists[0]?.name ?? '';
    const key = normalizeKey(item.name, artist);
    if (seen.has(key)) continue;
    seen.add(key);

    if (!queryAskedForVariant && NOISE_PATTERN.test(item.name)) {
      noisy.push(item);
    } else {
      clean.push(item);
    }
  }

  // Prefer clean matches, but fall back to noisy ones rather than returning
  // fewer than we could — a remix is still better than an empty slot.
  return [...clean, ...noisy].slice(0, RESULTS_RETURNED);
}

// ── Input validation ───────────────────────────────────────────────────────────

// Reject/truncate absurdly long queries before they ever hit the Spotify API.
const MAX_QUERY_LENGTH = 100;

// ── Rate guard ──────────────────────────────────────────────────────────────────
//
// This Server Action compiles to a public, unauthenticated HTTP endpoint with
// no request-identifying info (no IP/uid) passed in, so we can't key a limiter
// per-caller here. As a stopgap, cap the *total* number of calls the whole
// process will serve in a rolling fixed window, to bound Spotify API quota
// consumption and basic flooding.
//
// IMPORTANT — this is a best-effort, single-instance-only guard:
//   - State is an in-memory module-level counter, so it resets on every
//     restart/deploy and is NOT shared across multiple server instances,
//     regions, or serverless function invocations.
//   - It does nothing to stop a distributed attacker spread across instances.
// A real production deployment needs a distributed limiter (e.g. Upstash
// Redis with a sliding-window or token-bucket algorithm) keyed by IP/session.
// That's a follow-up, not something to build here.
const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX_CALLS = 20;

let windowStart = Date.now();
let windowCallCount = 0;

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    windowCallCount = 0;
  }
  windowCallCount += 1;
  return windowCallCount > RATE_LIMIT_MAX_CALLS;
}

// ── Public Server Action ───────────────────────────────────────────────────────

/**
 * Searches Spotify for tracks matching `query`.
 * Returns the top 5 results shaped into our internal SpotifyTrack type.
 *
 * Called directly from Client Components via Next.js Server Actions.
 */
export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (trimmed.length > MAX_QUERY_LENGTH) {
    console.warn(
      `[VibeQueue] Spotify search query rejected: exceeds ${MAX_QUERY_LENGTH} characters.`,
    );
    return [];
  }

  if (isRateLimited()) {
    console.warn(
      `[VibeQueue] Spotify search rate limit exceeded (${RATE_LIMIT_MAX_CALLS} calls / ${RATE_LIMIT_WINDOW_MS}ms). Rejecting request.`,
    );
    return [];
  }

  const token = await getSpotifyToken();

  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('type', 'track');
  // Over-fetch beyond what we show — cleanUpResults trims noise/duplicates
  // out of this larger pool before we hand back RESULTS_RETURNED tracks.
  url.searchParams.set('limit', String(SEARCH_FETCH_LIMIT));

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
  const rawItems: RawSpotifyTrack[] = data.tracks?.items ?? [];
  const items = cleanUpResults(rawItems, trimmed);

  return items.map((item) => ({
    id:       item.id,
    title:    item.name,
    artist:   item.artists.map((a) => a.name).join(', '),
    // Prefer the 300×300 image (index 1); fall back to largest (index 0) or empty
    albumArt: item.album.images[1]?.url ?? item.album.images[0]?.url ?? '',
  }));
}
