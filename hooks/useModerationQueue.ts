'use client';

// ─── useModerationQueue ───────────────────────────────────────────────────────
// Admin-only queue listener — returns ALL songs regardless of status,
// ordered by upvoteCount DESC then timestamp ASC.
// Used by the ModerationQueue component to show both pending and approved tracks.

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { QueuedSong } from '@/types';

interface UseModerationQueueReturn {
  pending:  QueuedSong[];
  approved: QueuedSong[];
  loading:  boolean;
  error:    FirestoreError | null;
}

export function useModerationQueue(venueId: string): UseModerationQueueReturn {
  const [all, setAll]       = useState<QueuedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!venueId) return;

    const q = query(
      collection(db, `venue_queues/${venueId}/queued_songs`),
      orderBy('upvoteCount', 'desc'),
      orderBy('timestamp',   'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const songs: QueuedSong[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id:             d.id,
            spotifyTrackId: data.spotifyTrackId ?? '',
            title:          data.title          ?? 'Unknown Track',
            artist:         data.artist         ?? 'Unknown Artist',
            albumArt:       data.albumArt        ?? '',
            upvoteCount:    data.upvoteCount     ?? 0,
            timestamp:      data.timestamp?.toDate() ?? null,
            requestedBy:    data.requestedBy     ?? '',
            status:         data.status          ?? 'approved',
          };
        });
        setAll(songs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[VibeQueue] Moderation queue error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [venueId]);

  return {
    pending:  all.filter((s) => s.status === 'pending'),
    approved: all.filter((s) => s.status === 'approved'),
    loading,
    error,
  };
}
