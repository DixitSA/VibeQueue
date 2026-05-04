// ─── Shared domain types ─────────────────────────────────────────────────────
// Single source of truth imported by lib/, hooks/, and components/.

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
}

/** A track returned by the Spotify Search API. */
export interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
}
