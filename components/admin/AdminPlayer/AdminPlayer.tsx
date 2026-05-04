'use client';

// ─── AdminPlayer ──────────────────────────────────────────────────────────────
// Left panel of the Command Center.
// Polls getNowPlaying every 5 s and shows the current track with a Master Skip.

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import AlbumArt from '@/components/AlbumArt/AlbumArt';
import { getNowPlaying, skipTrack } from '@/lib/spotifyAdmin';
import type { NowPlaying } from '@/types';

interface AdminPlayerProps {
  venueId:          string;
  spotifyConnected: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function AdminPlayer({ venueId, spotifyConnected }: AdminPlayerProps) {
  const [nowPlaying, setNowPlaying]   = useState<NowPlaying | null>(null);
  const [isSkipping, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState(0);

  // ── Fetch now playing ────────────────────────────────────────────────────
  const fetchNowPlaying = useCallback(() => {
    if (!spotifyConnected) return;
    startTransition(async () => {
      try {
        const data = await getNowPlaying(venueId);
        setNowPlaying(data);
        if (data) setLocalProgress(data.progressMs);
      } catch {
        // Silently fail — Spotify may temporarily be unavailable
      }
    });
  }, [venueId, spotifyConnected]);

  // Poll every 5 s
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  // Animate progress bar locally between polls
  useEffect(() => {
    if (!nowPlaying?.isPlaying) return;
    const tick = setInterval(() => {
      setLocalProgress((prev) => Math.min(prev + 1000, nowPlaying.durationMs));
    }, 1000);
    return () => clearInterval(tick);
  }, [nowPlaying]);

  const handleSkip = () => {
    startTransition(async () => {
      await skipTrack(venueId);
      // Re-fetch after a short delay to let Spotify update
      setTimeout(fetchNowPlaying, 800);
    });
  };

  const progressPct = nowPlaying
    ? Math.min((localProgress / nowPlaying.durationMs) * 100, 100)
    : 0;

  // ── Not connected state ──────────────────────────────────────────────────
  if (!spotifyConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 p-8">
        <div className="w-20 h-20 bg-cream/5 rounded-full flex items-center justify-center">
          <svg className="w-9 h-9 text-cream/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
        <p className="text-cream/30 font-sans text-sm text-center">Connect Spotify to see what&apos;s playing.</p>
      </div>
    );
  }

  // ── Nothing playing state ────────────────────────────────────────────────
  if (!nowPlaying) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 p-8">
        <div className="w-20 h-20 bg-cream/5 rounded-sm flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-14 h-14 rounded-full border border-cream/10" />
            <div className="absolute w-9 h-9 rounded-full border border-cream/10" />
            <div className="w-3 h-3 rounded-full bg-cream/20" />
          </div>
        </div>
        <p className="text-cream/30 font-sans text-sm text-center">Nothing playing right now.</p>
        <p className="text-cream/20 text-xs text-center">Start a track on Spotify to see it here.</p>
      </div>
    );
  }

  // ── Now Playing ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-8 gap-8">
      {/* Header label */}
      <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">
        Now Playing
      </p>

      {/* Album art — high fidelity, large */}
      <div className="relative aspect-square w-full max-w-[280px] mx-auto flex-shrink-0">
        <div className={`absolute inset-0 rounded-sm overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${nowPlaying.isPlaying ? 'shadow-emerald/10' : ''}`}>
          {nowPlaying.albumArt ? (
            <img
              src={nowPlaying.albumArt}
              alt={nowPlaying.trackName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-cream/5 flex items-center justify-center">
              <AlbumArt src="" alt="" size="lg" />
            </div>
          )}
        </div>
        {/* Playing indicator */}
        {nowPlaying.isPlaying && (
          <div className="absolute -bottom-3 -right-3 w-8 h-8 bg-emerald rounded-full flex items-center justify-center shadow-lg">
            <span className="text-charcoal text-[10px]">▶</span>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="text-center">
        <h2 className="text-cream font-display text-2xl font-bold leading-tight truncate">
          {nowPlaying.trackName}
        </h2>
        <p className="text-cream/50 font-display text-sm uppercase tracking-widest mt-1 truncate">
          {nowPlaying.artistName}
        </p>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="h-[3px] w-full bg-cream/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald transition-all duration-1000 ease-linear rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-cream/30 text-[10px] font-display tabular-nums">{formatTime(localProgress)}</span>
          <span className="text-cream/30 text-[10px] font-display tabular-nums">{formatTime(nowPlaying.durationMs)}</span>
        </div>
      </div>

      {/* Master Skip — large iPad-friendly target */}
      <button
        onClick={handleSkip}
        disabled={isSkipping}
        className="
          w-full py-5 rounded-sm
          border border-cream/15 bg-cream/5
          text-cream font-display font-bold text-sm uppercase tracking-widest
          flex items-center justify-center gap-3
          hover:bg-cream/10 hover:border-cream/25
          active:scale-[0.98]
          transition-all duration-150
          disabled:opacity-40 disabled:cursor-not-allowed
          min-h-[64px]
        "
      >
        {isSkipping ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        )}
        Master Skip
      </button>
    </div>
  );
}
