// ─── Venue settings helpers ───────────────────────────────────────────────────
// Client-side Firestore helpers for venue_settings/{venueId}.

import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
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
 * Never pass token fields here — those are written by the OAuth callback only.
 */
export async function updateVenueSettings(
  venueId: string,
  updates: Partial<Omit<VenueSettings, 'spotifyAccessToken' | 'spotifyRefreshToken' | 'tokenExpiresAt'>>,
): Promise<void> {
  await setDoc(doc(db, 'venue_settings', venueId), updates, { merge: true });
}
