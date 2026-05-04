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
