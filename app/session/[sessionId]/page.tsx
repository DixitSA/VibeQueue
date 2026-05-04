'use client';

import React, { use, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import CurrentlyPlaying from '@/components/CurrentlyPlaying/CurrentlyPlaying';
import QueueList from '@/components/QueueList/QueueList';
import SearchFAB from '@/components/SearchFAB/SearchFAB';
import SearchOverlay from '@/components/SearchOverlay/SearchOverlay';
import AppContainer from '@/components/AppContainer/AppContainer';

// Next.js 15+ makes dynamic route params async.
// Client Components unwrap them with React.use().
export default function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Anonymous auth — uid is null for the first ~100 ms while Firebase resolves.
  // SearchOverlay guards against null uid before writing to Firestore.
  const { user } = useAuth();

  return (
    <AppContainer>
      <main className="flex-1 flex flex-col relative min-h-full">
        <CurrentlyPlaying />

        <div className="flex-1">
          <QueueList venueId={sessionId} />
        </div>

        <SearchFAB onClick={() => setIsSearchOpen(true)} />

        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          venueId={sessionId}
          uid={user?.uid ?? null}
        />

        <footer className="py-12 text-center">
          <p className="text-cream/20 text-[9px] uppercase tracking-widest">
            Powered by VibeQueue &amp; Spotify
          </p>
        </footer>
      </main>
    </AppContainer>
  );
}
