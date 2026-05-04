'use server';

// ─── Spotify Admin Server Actions ─────────────────────────────────────────────
// All functions run server-side — tokens never touch the browser.
// Reads/writes venue_secrets/{venueId} for token management (Admin SDK).

import { adminDb } from './firebaseAdmin';
import type { SpotifyDevice, NowPlaying } from '@/types';

// ── Internal: token management ────────────────────────────────────────────────

async function getAccessToken(venueId: string): Promise<string> {
  // Use adminDb to access private secrets collection
  const snap = await adminDb.collection('venue_secrets').doc(venueId).get();
  if (!snap.exists) {
    // Fallback: Check if they are still in venue_settings (legacy)
    const settingsSnap = await adminDb.collection('venue_settings').doc(venueId).get();
    if (settingsSnap.exists && settingsSnap.data()?.spotifyRefreshToken) {
      console.log(`[VibeQueue] Migrating tokens for ${venueId} to venue_secrets...`);
      const data = settingsSnap.data()!;
      await adminDb.collection('venue_secrets').doc(venueId).set({
        spotifyAccessToken:  data.spotifyAccessToken,
        spotifyRefreshToken: data.spotifyRefreshToken,
        tokenExpiresAt:      data.tokenExpiresAt,
      });
      // Return the token we just migrated
      return data.spotifyAccessToken;
    }
    throw new Error(`[VibeQueue] No connection for venue: ${venueId}`);
  }

  const data = snap.data()!;
  if (!data.spotifyAccessToken) throw new Error('[VibeQueue] Spotify not connected.');

  // Use cached token if it has > 60 s remaining
  const expiresAt: number = data.tokenExpiresAt?.toDate?.()?.getTime() ?? data.tokenExpiresAt?._seconds * 1000 ?? 0;
  if (Date.now() < expiresAt - 60_000) return data.spotifyAccessToken as string;

  // Refresh
  return refreshAccessToken(venueId, data.spotifyRefreshToken as string);
}

async function refreshAccessToken(venueId: string, refreshToken: string): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      Authorization:   `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('[VibeQueue] Token refresh failed.');

  // Persist refreshed token in venue_secrets (NEVER venue_settings)
  await adminDb.collection('venue_secrets').doc(venueId).set({
    spotifyAccessToken: data.access_token,
    tokenExpiresAt:     new Date(Date.now() + data.expires_in * 1000),
    ...(data.refresh_token ? { spotifyRefreshToken: data.refresh_token } : {}),
  }, { merge: true });

  return data.access_token as string;
}

// ── Public server actions ─────────────────────────────────────────────────────

/** Returns all available Spotify Connect devices for the venue's account. */
export async function getDevices(venueId: string): Promise<SpotifyDevice[]> {
  const token = await getAccessToken(venueId);
  const res   = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.devices ?? []).map((d: any) => ({
    id:       d.id,
    name:     d.name,
    type:     d.type,
    isActive: d.is_active,
  }));
}

/** Returns the currently playing track, or null if nothing is playing. */
export async function getNowPlaying(venueId: string): Promise<NowPlaying | null> {
  const token = await getAccessToken(venueId);
  const res   = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (res.status === 204 || res.status === 401) return null;

  const data = await res.json();
  if (!data?.item) return null;

  return {
    trackName:  data.item.name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    artistName: data.item.artists.map((a: any) => a.name).join(', '),
    albumArt:   data.item.album.images[0]?.url ?? '',
    progressMs: data.progress_ms  ?? 0,
    durationMs: data.item.duration_ms ?? 0,
    isPlaying:  data.is_playing   ?? false,
  };
}

/** Skips to the next track. */
export async function skipTrack(venueId: string): Promise<void> {
  const token = await getAccessToken(venueId);
  await fetch('https://api.spotify.com/v1/me/player/next', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Transfers playback to the specified device and starts playing. */
export async function transferPlayback(venueId: string, deviceId: string): Promise<void> {
  const token = await getAccessToken(venueId);
  await fetch('https://api.spotify.com/v1/me/player', {
    method:  'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ device_ids: [deviceId], play: true }),
  });
}
