'use server';

// ─── Venue Server Actions ───────────────────────────────────────────────────
// Server-side Firestore operations using the Admin SDK.

import { adminDb } from '@/lib/firebaseAdmin';
import type { VenueSettings } from '@/types';

/**
 * Merges partial updates into venue_settings/{venueId}.
 * This is a Server Action.
 */
export async function updateVenueSettings(
  venueId: string,
  updates: Partial<Omit<VenueSettings, 'spotifyAccessToken' | 'spotifyRefreshToken' | 'tokenExpiresAt'>>,
): Promise<void> {
  await adminDb.collection('venue_settings').doc(venueId).set(updates, { merge: true });
}

/**
 * Deletes a song from the queue.
 * Admin only.
 */
export async function deleteSong(
  venueId: string,
  songId: string,
): Promise<void> {
  await adminDb
    .collection('venue_queues')
    .doc(venueId)
    .collection('queued_songs')
    .doc(songId)
    .delete();
}

/**
 * Updates a song's moderation status (pending -> approved).
 */
export async function updateSongStatus(
  venueId: string,
  songId: string,
  status: string,
): Promise<void> {
  await adminDb
    .collection('venue_queues')
    .doc(venueId)
    .collection('queued_songs')
    .doc(songId)
    .update({ status });
}
