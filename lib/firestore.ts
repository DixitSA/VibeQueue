// ─── Firestore write helpers ──────────────────────────────────────────────────
// Client-side helpers — called from Client Components.
// All writes are validated by Firestore Security Rules server-side.

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from './firebase';
import type { SongStatus, SpotifyTrack } from '@/types';

// ── Request a song ────────────────────────────────────────────────────────────

/**
 * Writes a new song request to the venue's queue.
 * `status` defaults to 'approved'; pass 'pending' when manual approval is on.
 */
export async function requestSong(
  venueId: string,
  track: SpotifyTrack,
  uid: string,
  status: SongStatus = 'approved',
): Promise<void> {
  await addDoc(collection(db, `venue_queues/${venueId}/queued_songs`), {
    spotifyTrackId: track.id,
    title:          track.title,
    artist:         track.artist,
    albumArt:       track.albumArt,
    upvoteCount:    1,
    timestamp:      serverTimestamp(),
    requestedBy:    uid,
    status,
  });
}

// ── Increment upvote ──────────────────────────────────────────────────────────

/**
 * Atomically increments `upvoteCount` by 1.
 * The UI applies an optimistic +1 before this resolves; on failure the caller
 * rolls back local state.
 */
export async function incrementUpvote(
  venueId: string,
  songId: string,
): Promise<void> {
  await updateDoc(
    doc(db, `venue_queues/${venueId}/queued_songs`, songId),
    { upvoteCount: increment(1) },
  );
}

// Moderation actions migrated to Server Actions in lib/venueActions.ts
