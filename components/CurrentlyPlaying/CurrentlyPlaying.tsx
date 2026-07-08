'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { getNowPlaying } from '@/lib/spotifyAdmin';
import type { NowPlaying } from '@/types';

// ─── CurrentlyPlaying ─────────────────────────────────────────────────────────
// Sticky patron-facing header. Polls the venue's live playback state every 5 s
// (paused while the tab isn't visible), mirroring the pattern used by
// components/admin/AdminPlayer/AdminPlayer.tsx. getNowPlaying is intentionally
// public/unauthenticated — no token is passed.

interface CurrentlyPlayingProps {
  venueId: string;
}

export default function CurrentlyPlaying({ venueId }: CurrentlyPlayingProps) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [loaded, setLoaded]         = useState(false);

  const fetchNowPlaying = useCallback(() => {
    if (!venueId) return;
    getNowPlaying(venueId)
      .then((data) => setNowPlaying(data))
      .catch(() => {
        // Silently fail — Spotify may be temporarily unavailable or not connected
        setNowPlaying(null);
      })
      .finally(() => setLoaded(true));
  }, [venueId]);

  // Poll every 5 s, only while the tab is visible
  useEffect(() => {
    fetchNowPlaying();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchNowPlaying();
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNowPlaying();
    }, 5000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNowPlaying]);

  const progressPct = nowPlaying && nowPlaying.durationMs > 0
    ? Math.min((nowPlaying.progressMs / nowPlaying.durationMs) * 100, 100)
    : 0;

  // ── Nothing playing / not connected — keep the header compact ────────────
  if (!loaded || !nowPlaying) {
    return (
      <div className="sticky top-0 z-50 glass-vellum backdrop-blur-md px-6 pt-safe pb-3 flex flex-col gap-0 border-b border-cream/10">
        <div className="flex items-center gap-3 mt-4 mb-2">
          <div className="relative w-14 h-14 bg-cream/10 rounded-sm overflow-hidden flex-shrink-0 border border-cream/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-cream/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display uppercase tracking-[0.2em] text-cream/50 mb-0.5">Now Playing</p>
            <h2 className="text-cream/60 font-display text-lg font-medium truncate leading-tight">
              Nothing playing
            </h2>
            <p className="text-cream/60 text-sm truncate">Waiting for the venue&rsquo;s Spotify session</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Now Playing ────────────────────────────────────────────────────────────
  return (
    <div className="sticky top-0 z-50 glass-vellum backdrop-blur-md px-6 pt-safe pb-3 flex flex-col gap-0 border-b border-cream/10">
      <div className="flex items-center gap-3 mt-4 mb-2">
        <div className="relative">
          <div className="relative w-14 h-14 bg-cream/10 rounded-sm overflow-hidden flex-shrink-0 border border-cream/20">
            {nowPlaying.albumArt ? (
              <Image
                src={nowPlaying.albumArt}
                alt={nowPlaying.trackName}
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-charcoal ${nowPlaying.isPlaying ? 'bg-emerald animate-pulse' : 'bg-cream/30'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-cream/50 mb-0.5">Now Playing</p>
          <h2 className="text-cream font-display text-lg font-medium truncate leading-tight">
            {nowPlaying.trackName}
          </h2>
          <p className="text-cream/60 text-sm truncate">{nowPlaying.artistName}</p>
        </div>
      </div>

      {/* Progress Bar Container — transform, not width, avoids a layout
          recalculation on every poll tick. */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cream/10">
        <div
          className="h-full w-full bg-emerald origin-left transition-transform duration-300 ease-linear shadow-emerald-glow-sm"
          style={{ transform: `scaleX(${progressPct / 100})` }}
        />
      </div>
    </div>
  );
}
