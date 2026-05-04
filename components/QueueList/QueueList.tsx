'use client';

import React, { useState, useEffect } from 'react';
import QueueCard from '../QueueCard/QueueCard';
import QueueSkeleton from './QueueSkeleton';

const MOCK_SONGS = [
  {
    id: '1',
    trackName: 'Starboy',
    artistName: 'The Weeknd',
    albumArt: 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=200&auto=format&fit=crop',
    upvotes: 12
  },
  {
    id: '2',
    trackName: 'Blinding Lights',
    artistName: 'The Weeknd',
    albumArt: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop',
    upvotes: 8
  },
  {
    id: '3',
    trackName: 'Levitating',
    artistName: 'Dua Lipa',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop',
    upvotes: 7
  },
  {
    id: '4',
    trackName: 'Save Your Tears',
    artistName: 'The Weeknd',
    albumArt: 'https://images.unsplash.com/photo-1514525253344-f814d074358a?q=80&w=200&auto=format&fit=crop',
    upvotes: 5
  },
  {
    id: '5',
    trackName: 'Peaches',
    artistName: 'Justin Bieber',
    albumArt: 'https://invalid-url.com/broken.jpg',
    upvotes: 3
  }
];

export default function QueueList() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="px-6 py-8">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-cream font-display text-2xl font-light uppercase tracking-tighter">
          Up Next
        </h2>
        <span className="text-cream/40 font-display text-xs uppercase tracking-widest">
          {isLoading ? '--' : MOCK_SONGS.length} Songs
        </span>
      </div>
      
      {isLoading ? (
        <QueueSkeleton />
      ) : (
        <div className="flex flex-col gap-1">
          {MOCK_SONGS.map((song) => (
            <QueueCard key={song.id} {...song} />
          ))}
        </div>
      )}
      
      {!isLoading && (
        <div className="mt-12 mb-8 text-center">
          <div className="inline-block px-4 py-1 border border-cream/10 rounded-full">
            <p className="text-cream/30 text-[10px] uppercase tracking-[0.3em] font-medium">
              Scroll for more
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
