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

  // Poll every 5 s (only when tab is visible)
  useEffect(() => {
    fetchNowPlaying();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNowPlaying();
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNowPlaying();
      }
    }, 5000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      <div className="flex flex-col h-full p-12 justify-center">
        <div className="max-w-xs mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-2">
            <h3 className="text-cream font-display text-2xl font-bold tracking-tight">System Offline</h3>
            <p className="text-cream/30 text-xs uppercase tracking-widest font-bold">Account Authorization Required</p>
          </div>
          
          <div className="space-y-6">
            {[
              { step: '01', title: 'Authenticate', desc: 'Connect your Spotify Premium account below.' },
              { step: '02', title: 'Select Device', desc: 'Choose the active output from the list.' },
              { step: '03', title: 'Sync Queue', desc: 'Live playback will appear here automatically.' }
            ].map((item) => (
              <div key={item.step} className="flex gap-4 group">
                <span className="text-cream/20 font-display text-xs font-bold mt-1 group-hover:text-emerald transition-colors">{item.step}</span>
                <div className="space-y-1">
                  <p className="text-cream/80 font-display text-sm font-bold uppercase tracking-wide">{item.title}</p>
                  <p className="text-cream/30 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-cream/5">
             <div className="flex items-center gap-3 px-4 py-3 bg-cream/5 rounded-sm border border-cream/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <span className="text-[10px] uppercase tracking-widest text-cream/40 font-bold">Bridge Disconnected</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Nothing playing state ────────────────────────────────────────────────
  if (!nowPlaying) {
    return (
      <div className="flex flex-col h-full p-12 justify-center">
        <div className="max-w-xs mx-auto w-full space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="space-y-2">
            <h3 className="text-cream font-display text-2xl font-bold tracking-tight">Setup Required</h3>
            <p className="text-cream/30 text-xs uppercase tracking-widest font-bold">Follow these steps to go live</p>
          </div>
          
          <div className="space-y-6">
            {[
              { step: '01', title: 'Open Spotify', desc: 'Launch Spotify on your playback device.' },
              { step: '02', title: 'Start a Track', desc: 'Play any song to initialize the session.' },
              { step: '03', title: 'Select Device', desc: 'Use the connector below to link this tab.' }
            ].map((item) => (
              <div key={item.step} className="flex gap-4 group">
                <span className="text-emerald font-display text-xs font-bold mt-1 group-hover:scale-110 transition-transform">{item.step}</span>
                <div className="space-y-1">
                  <p className="text-cream/80 font-display text-sm font-bold uppercase tracking-wide">{item.title}</p>
                  <p className="text-cream/30 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-cream/5">
             <div className="flex items-center gap-3 px-4 py-3 bg-cream/5 rounded-sm border border-cream/10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-cream/40 font-bold">Waiting for Signal...</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Now Playing ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full p-8 gap-10">
      {/* Header label */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">
          Now Playing
        </p>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          <span className="text-[8px] uppercase tracking-[0.2em] text-emerald/60 font-bold font-display">Live Link</span>
        </div>
      </div>

      {/* Track info — BILLBOARD MODE for distance legibility */}
      <div className="flex flex-col gap-2">
        <h2 className="text-cream font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[0.9] break-words">
          {nowPlaying.trackName}
        </h2>
        <p className="text-cream/40 font-display text-xl uppercase tracking-widest font-medium mt-2">
          {nowPlaying.artistName}
        </p>
      </div>

      {/* Album art — more subtle when billboard is active */}
      <div className="relative aspect-square w-full max-w-[200px] flex-shrink-0 group">
        <div className={`absolute inset-0 rounded-sm overflow-hidden border border-cream/10 transition-all duration-700 group-hover:scale-105 ${nowPlaying.isPlaying ? 'shadow-[0_20px_50px_rgba(16,185,129,0.15)]' : ''}`}>
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
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-3 mt-auto">
        <div className="h-[2px] w-full bg-cream/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald transition-all duration-1000 ease-linear rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-cream/20 text-[10px] font-display tabular-nums font-bold uppercase tracking-widest">{formatTime(localProgress)}</span>
          <span className="text-cream/20 text-[10px] font-display tabular-nums font-bold uppercase tracking-widest">{formatTime(nowPlaying.durationMs)}</span>
        </div>
      </div>

      {/* Master Skip — mechanical feel */}
      <button
        onClick={handleSkip}
        disabled={isSkipping}
        className="
          w-full py-6 rounded-sm
          border-2 border-emerald/10 bg-emerald/5
          text-emerald font-display font-bold text-xs uppercase tracking-[0.3em]
          flex items-center justify-center gap-4
          hover:bg-emerald/10 hover:border-emerald/30
          active:scale-[0.97] active:bg-emerald/20
          transition-all duration-300
          disabled:opacity-20 disabled:grayscale
          min-h-[80px]
        "
      >
        {isSkipping ? (
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
            Master Skip
          </>
        )}
      </button>
    </div>
  );
}
