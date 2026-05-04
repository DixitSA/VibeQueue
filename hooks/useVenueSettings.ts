'use client';

// ─── useVenueSettings ─────────────────────────────────────────────────────────
// Real-time listener for venue_settings/{venueId}.
// Drives the ConnectionCard, ApprovalToggle, and VibeSettings components.

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_SETTINGS } from '@/lib/venueSettings';
import type { VenueSettings } from '@/types';

interface UseVenueSettingsReturn {
  settings: VenueSettings;
  loading: boolean;
}

export function useVenueSettings(venueId: string): UseVenueSettingsReturn {
  const [settings, setSettings] = useState<VenueSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!venueId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'venue_settings', venueId),
      (snap) => {
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as VenueSettings);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[VibeQueue] Venue settings listener error:', err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [venueId]);

  return { settings, loading };
}
