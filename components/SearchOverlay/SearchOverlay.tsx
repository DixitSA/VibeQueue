'use client';

import React, { useEffect, useRef, useState } from 'react';
import AlbumArt from '../AlbumArt/AlbumArt';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MockTrack {
  id: string;
  trackName: string;
  artistName: string;
  albumArt: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
// Replaced at Spotify-integration step with live API calls.

const MOCK_TRACKS: MockTrack[] = [
  {
    id: 'r1',
    trackName: 'Midnight City',
    artistName: 'M83',
    albumArt:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'r2',
    trackName: 'Blinding Lights',
    artistName: 'The Weeknd',
    albumArt:
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'r3',
    trackName: 'Levitating',
    artistName: 'Dua Lipa',
    albumArt:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'r4',
    trackName: 'Starboy',
    artistName: 'The Weeknd ft. Daft Punk',
    albumArt:
      'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 'r5',
    trackName: 'Peaches',
    artistName: 'Justin Bieber',
    albumArt: '', // intentionally empty — exercises the vinyl fallback
  },
  {
    id: 'r6',
    trackName: 'Bad Guy',
    artistName: 'Billie Eilish',
    albumArt:
      'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop',
  },
];

// ─── SearchResultCard ─────────────────────────────────────────────────────────
// Condensed, non-flipping card — same design DNA as QueueCard but optimised
// for the search list: smaller art, tighter padding, single-action (+) button.

function SearchResultCard({
  track,
  onAdd,
}: {
  track: MockTrack;
  onAdd: (track: MockTrack) => void;
}) {
  const [added, setAdded] = useState(false);
  const [isPopping, setIsPopping] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added) return;
    
    setIsPopping(false);
    requestAnimationFrame(() => {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 350);
    });

    setAdded(true);
    onAdd(track);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-charcoal/[0.07] last:border-0">
      <AlbumArt src={track.albumArt} alt={track.trackName} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-charcoal font-display font-semibold text-sm truncate leading-snug">
          {track.trackName}
        </p>
        <p className="text-charcoal/50 text-[10px] uppercase tracking-widest font-bold truncate mt-0.5">
          {track.artistName}
        </p>
      </div>

      {/* Add / Added button */}
      <button
        onClick={handleAdd}
        disabled={added}
        aria-label={added ? `${track.trackName} added` : `Add ${track.trackName} to queue`}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center
          transition-all duration-300
          ${added
            ? 'bg-charcoal border-charcoal text-cream scale-95'
            : 'bg-transparent border-charcoal/25 text-charcoal/40 hover:border-charcoal hover:text-charcoal active:scale-95'
          }
          ${isPopping ? 'animate-haptic-pop' : ''}
        `}
      >
        {added ? (
          /* Checkmark */
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          /* Plus */
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v16M4 12h16" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── SearchOverlay ────────────────────────────────────────────────────────────
/*
  Design spec:
  • Full-screen (not bottom-sheet) — fills the viewport edge-to-edge
  • Background: cream/93 + backdrop-blur-2xl  →  vellum-over-glass feel
  • Search bar: prominent underline input, Monocle-style headline above it
  • Results: live-filtered SearchResultCards, fade in as query changes
  • Empty / no-query states handled gracefully
*/

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery]   = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derive results from query
  const results = query.trim().length > 0
    ? MOCK_TRACKS.filter(
        (t) =>
          t.trackName.toLowerCase().includes(query.toLowerCase()) ||
          t.artistName.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  // Mount / unmount with animation gate
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      // Wait one frame for the element to paint before focusing
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setMounted(false);
        setQuery('');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[100]
        bg-cream/93 backdrop-blur-2xl
        flex flex-col
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-charcoal/35 font-display">
          Add to Queue
        </p>
        <button
          onClick={onClose}
          className="text-charcoal/40 font-display text-xs uppercase tracking-widest font-bold hover:text-charcoal transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* ── Headline + search input ───────────────────────────────────────── */}
      <div className="px-6 pt-3 pb-6">
        <h2 className="text-charcoal font-display text-4xl font-bold tracking-tighter leading-none mb-6">
          Find a Track.
        </h2>

        {/* Underline-style input — Monocle editorial aesthetic */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, artist, or album…"
            className="
              w-full bg-transparent
              border-b-2 border-charcoal/20 focus:border-charcoal
              outline-none px-0 py-3
              text-charcoal font-display text-xl font-medium
              placeholder:text-charcoal/25
              transition-colors duration-200
            "
          />

          {/* Clear button — only visible when query has text */}
          {query.length > 0 && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div className="h-px bg-charcoal/10 mx-6" />

      {/* ── Results / states ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6">

        {/* Empty query — prompt */}
        {query.trim().length === 0 && (
          <div className="flex flex-col items-center justify-center h-full pb-24 gap-4">
            <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-charcoal/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-charcoal/30 font-sans text-sm text-center max-w-[200px] leading-relaxed">
              Type to discover tracks and add them to the session.
            </p>
          </div>
        )}

        {/* Query with no matches */}
        {query.trim().length > 0 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-charcoal/40 font-display text-sm uppercase tracking-widest">
              No results
            </p>
            <p className="text-charcoal/25 font-sans text-xs text-center">
              Try a different title or artist name.
            </p>
          </div>
        )}

        {/* Result list */}
        {results.length > 0 && (
          <div className="py-3">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/30 mb-3">
              {results.length} Result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((track) => (
              <SearchResultCard
                key={track.id}
                track={track}
                onAdd={(t) => {
                  // TODO: wire to Firestore queue write at integration step
                  console.log('[VibeQueue] Add to queue →', t.trackName);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
