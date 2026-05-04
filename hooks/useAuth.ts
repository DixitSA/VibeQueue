'use client';

// ─── useAuth — Anonymous Authentication ───────────────────────────────────────
// Signs every visitor in anonymously via Firebase Auth on first load.
// The uid persists in IndexedDB so the same patron keeps their identity
// across page refreshes within the same browser session.

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseAuthReturn {
  user: User | null;
  /** true while the initial auth state is being resolved */
  loading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Already authenticated (either anonymous or signed-in)
        setUser(currentUser);
        setLoading(false);
      } else {
        // No session — create an anonymous one
        try {
          const credential = await signInAnonymously(auth);
          setUser(credential.user);
        } catch (err) {
          console.error('[VibeQueue] Anonymous sign-in failed:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
