// ─── Firestore write helpers ──────────────────────────────────────────────────
// Client-side helpers only — called from Client Components.
// All writes are validated by Firestore Security Rules server-side.

import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from './firebase';
import type { SpotifyTrack } from '@/types';

// ── Request a song ────────────────────────────────────────────────────────────

/**
 * Writes a new song request to the venue's queue.
 * The requesting patron receives 1 implicit upvote (upvoteCount starts at 1).
 *
 * Collection path: venue_queues/{venueId}/queued_songs
 */
export async function requestSong(
  venueId: string,
  track: SpotifyTrack,
  uid: string,
): Promise<void> {
  await addDoc(collection(db, `venue_queues/${venueId}/queued_songs`), {
    spotifyTrackId: track.id,
    title:          track.title,
    artist:         track.artist,
    albumArt:       track.albumArt,
    upvoteCount:    1,
    timestamp:      serverTimestamp(),
    requestedBy:    uid,
  });
}

// ── Increment upvote ──────────────────────────────────────────────────────────

/**
 * Atomically increments `upvoteCount` by 1 using Firestore's FieldValue.increment.
 * The UI applies an optimistic +1 before this resolves; on failure the caller
 * is responsible for rolling back the local state.
 */
export async function incrementUpvote(
  venueId: string,
  songId: string,
): Promise<void> {
  const songRef = doc(db, `venue_queues/${venueId}/queued_songs`, songId);
  await updateDoc(songRef, {
    upvoteCount: increment(1),
  });
}
