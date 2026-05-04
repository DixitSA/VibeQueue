// ─── Shared domain types ─────────────────────────────────────────────────────
// Single source of truth imported by lib/, hooks/, and components/.

// ── Patron queue ──────────────────────────────────────────────────────────────

/** Moderation state of a queued song. */
export type SongStatus = 'pending' | 'approved';

/** A song that lives inside a venue's Firestore queue. */
export interface QueuedSong {
  /** Firestore document ID */
  id: string;
  /** Spotify track ID — used for deduplication checks */
  spotifyTrackId: string;
  title: string;
  artist: string;
  albumArt: string;
  upvoteCount: number;
  /** null until the server timestamp resolves on the client */
  timestamp: Date | null;
  /** Anonymous UID of the patron who requested the track */
  requestedBy: string;
  /** Defaults to 'approved'; set to 'pending' when manual approval is on */
  status: SongStatus;
}

/** A track returned by the Spotify Search API. */
export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
}

// ── Venue / admin ─────────────────────────────────────────────────────────────

/** Persisted in venue_settings/{venueId}. */
export interface VenueSettings {
  manualApprovalMode: boolean;
  forbiddenGenres: string[];
  vibeSeeds: string[];
  activeDeviceId: string | null;
  spotifyConnected: boolean;
  // Spotify OAuth tokens — read server-side only via spotifyAdmin.ts
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  tokenExpiresAt?: Date | null;
}

/** A Spotify Connect output device. */
export interface SpotifyDevice {
  id: string;
  name: string;
  /** 'Computer' | 'Smartphone' | 'Speaker' etc. */
  type: string;
  isActive: boolean;
}

/** Current Spotify playback state. */
export interface NowPlaying {
  trackName: string;
  artistName: string;
  albumArt: string;
  progressMs: number;
  durationMs: number;
  isPlaying: boolean;
}
