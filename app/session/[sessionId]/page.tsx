'use client';

import React, { useState } from 'react';
import CurrentlyPlaying from '@/components/CurrentlyPlaying/CurrentlyPlaying';
import QueueList from '@/components/QueueList/QueueList';
import SearchFAB from '@/components/SearchFAB/SearchFAB';
import SearchOverlay from '@/components/SearchOverlay/SearchOverlay';

export default function SessionPage({ params }: { params: { sessionId: string } }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <main className="flex-1 flex flex-col relative min-h-full">
      <CurrentlyPlaying />
      
      <div className="flex-1">
        <QueueList />
      </div>

      {/* Floating Action Button */}
      <SearchFAB onClick={() => setIsSearchOpen(true)} />

      {/* Full Screen Search Overlay */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Subtle footer credit */}
      <footer className="py-12 text-center">
        <p className="text-cream/20 text-[9px] uppercase tracking-widest">
          Powered by VibeQueue & Spotify
        </p>
      </footer>
    </main>
  );
}
