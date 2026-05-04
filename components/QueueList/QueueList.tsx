'use client';

import React from 'react';
import QueueCard from '../QueueCard/QueueCard';
import QueueSkeleton from './QueueSkeleton';
import { useQueue } from '@/hooks/useQueue';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueListProps {
  venueId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QueueList({ venueId }: QueueListProps) {
  const { songs, loading, error } = useQueue(venueId);

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-cream/40 font-display text-sm uppercase tracking-widest">
          Queue unavailable
        </p>
        <p className="text-cream/20 font-sans text-xs mt-2">
          {error.message}
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-6 pt-8 pb-32 pb-safe">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-cream font-display text-2xl font-light uppercase tracking-tighter">
          Up Next
        </h2>
        <span className="text-cream/40 font-display text-xs uppercase tracking-widest">
          {loading ? '--' : `${songs.length} Song${songs.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {loading ? (
        <QueueSkeleton />
      ) : songs.length === 0 ? (
        // Empty queue — invite the first request
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 bg-cream/5 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7 text-cream/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <p className="text-cream/30 font-sans text-sm text-center max-w-[180px] leading-relaxed">
            The queue is empty. Be the first to request a track.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {songs.map((song) => (
              <QueueCard
                key={song.id}
                id={song.id}
                venueId={venueId}
                trackName={song.title}
                artistName={song.artist}
                albumArt={song.albumArt}
                upvotes={song.upvoteCount}
              />
            ))}
          </div>

          <div className="mt-12 mb-8 text-center">
            <div className="inline-block px-4 py-1 border border-cream/10 rounded-full">
              <p className="text-cream/30 text-[10px] uppercase tracking-[0.3em] font-medium">
                Tap a card to upvote
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
