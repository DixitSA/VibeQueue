'use client';

// ─── useQueue — Real-time Firestore queue listener ────────────────────────────
// Opens an `onSnapshot` subscription to a venue's queued_songs collection.
// Results are sorted: highest upvoteCount first, then earliest timestamp.
//
// ⚠️  Firestore requires a composite index for multi-field orderBy.
//     Create the index at:
//     Firebase Console → Firestore → Indexes → Add composite index
//       Collection: queued_songs
//       Fields:     upvoteCount DESC, timestamp ASC

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

interface UseQueueReturn {
  songs: QueuedSong[];
  loading: boolean;
  error: FirestoreError | null;
}

export function useQueue(venueId: string): UseQueueReturn {
  const [songs, setSongs]   = useState<QueuedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!venueId) return;

    const q = query(
      collection(db, `venue_queues/${venueId}/queued_songs`),
      orderBy('upvoteCount', 'desc'),
      orderBy('timestamp', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const mapped: QueuedSong[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id:             docSnap.id,
            spotifyTrackId: data.spotifyTrackId ?? '',
            title:          data.title          ?? 'Unknown Track',
            artist:         data.artist         ?? 'Unknown Artist',
            albumArt:       data.albumArt        ?? '',
            upvoteCount:    data.upvoteCount     ?? 0,
            // serverTimestamp() resolves asynchronously — guard for null
            timestamp:      data.timestamp?.toDate() ?? null,
            requestedBy:    data.requestedBy     ?? '',
          };
        });

        setSongs(mapped);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[VibeQueue] Queue listener error:', err);
        setError(err);
        setLoading(false);
      },
    );

    // Unsubscribe when venueId changes or component unmounts
    return unsubscribe;
  }, [venueId]);

  return { songs, loading, error };
}
