'use server';

// ─── Venue settings helpers ───────────────────────────────────────────────────
// Server-side Firestore helpers for venue_settings/{venueId}.
// Using Admin SDK to bypass client-side write restrictions.

import { adminDb } from './firebaseAdmin';
import type { VenueSettings } from '@/types';

export const DEFAULT_SETTINGS: VenueSettings = {
  manualApprovalMode: false,
  forbiddenGenres:    [],
  vibeSeeds:          [],
  activeDeviceId:     null,
  spotifyConnected:   false,
};

/**
 * Merges partial updates into venue_settings/{venueId}.
 * Creates the document if it doesn't exist.
 * This is a Server Action.
 */
export async function updateVenueSettings(
  venueId: string,
  updates: Partial<Omit<VenueSettings, 'spotifyAccessToken' | 'spotifyRefreshToken' | 'tokenExpiresAt'>>,
): Promise<void> {
  await adminDb.collection('venue_settings').doc(venueId).set(updates, { merge: true });
}
