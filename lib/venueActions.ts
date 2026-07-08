'use server';

// ─── Venue Server Actions ───────────────────────────────────────────────────
// Server-side Firestore operations using the Admin SDK.

import { adminDb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import type { VenueSettings } from '@/types';

/**
 * Merges partial updates into venue_settings/{venueId}.
 * This is a Server Action. Admin only.
 */
export async function updateVenueSettings(
  idToken: string,
  venueId: string,
  updates: Partial<Omit<VenueSettings, 'spotifyAccessToken' | 'spotifyRefreshToken' | 'tokenExpiresAt'>>,
): Promise<void> {
  await requireAdmin(idToken, venueId);
  await adminDb.collection('venue_settings').doc(venueId).set(updates, { merge: true });
}

/**
 * Deletes a song from the queue.
 * Admin only.
 */
export async function deleteSong(
  idToken: string,
  venueId: string,
  songId: string,
): Promise<void> {
  await requireAdmin(idToken, venueId);
  await adminDb
    .collection('venue_queues')
    .doc(venueId)
    .collection('queued_songs')
    .doc(songId)
    .delete();
}

/**
 * Updates a song's moderation status (pending -> approved).
 * Admin only.
 */
export async function updateSongStatus(
  idToken: string,
  venueId: string,
  songId: string,
  status: string,
): Promise<void> {
  await requireAdmin(idToken, venueId);
  await adminDb
    .collection('venue_queues')
    .doc(venueId)
    .collection('queued_songs')
    .doc(songId)
    .update({ status });
}
