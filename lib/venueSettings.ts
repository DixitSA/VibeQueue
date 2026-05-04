// ─── Venue settings constants ────────────────────────────────────────────────
// Shared types and constants for venue settings.

import type { VenueSettings } from '@/types';

export const DEFAULT_SETTINGS: VenueSettings = {
  manualApprovalMode: false,
  forbiddenGenres:    [],
  vibeSeeds:          [],
  activeDeviceId:     null,
  spotifyConnected:   false,
};
