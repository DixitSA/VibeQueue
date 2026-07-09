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
  /** UIDs of patrons who have upvoted — enforces one vote per user */
  voters: string[];
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
  /** Spotify track ID of the song the queue-sync loop most recently pushed
   *  to Spotify's real queue, so it knows not to push another until this
   *  one starts playing. Tracked here (not via Spotify's own /player/queue
   *  endpoint) because that endpoint also returns upcoming tracks from
   *  whatever playlist/album context is currently driving playback, which
   *  makes "is the queue empty" useless as a signal once any playlist is
   *  playing in the background — the normal way most venues play music. */
  lastAutoQueuedTrackId?: string | null;
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
  /** Spotify track ID of the currently playing track — used to match it
   *  against the Firestore queue and detect when a queued song has started. */
  spotifyTrackId: string | null;
}
