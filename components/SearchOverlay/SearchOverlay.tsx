'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import AlbumArt from '../AlbumArt/AlbumArt';
import { searchSpotify } from '@/lib/spotify';
import { requestSong } from '@/lib/firestore';
import type { SpotifyTrack } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
  /** Anonymous UID from useAuth — null while auth is still resolving */
  uid: string | null;
}

// ─── SearchResultCard ─────────────────────────────────────────────────────────
// Condensed non-flipping card — same design DNA as QueueCard.

function SearchResultCard({
  track,
  onAdd,
}: {
  track: SpotifyTrack;
  onAdd: (track: SpotifyTrack) => Promise<void>;
}) {
  const [added, setAdded]       = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added || isAdding) return;

    // Haptic pop
    setIsPopping(false);
    requestAnimationFrame(() => {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 350);
    });

    setIsAdding(true);
    try {
      await onAdd(track);
      setAdded(true);
    } catch (err) {
      console.error('[VibeQueue] Failed to add track:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-charcoal/[0.07] last:border-0">
      <AlbumArt src={track.albumArt} alt={track.title} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-charcoal font-display font-semibold text-sm truncate leading-snug">
          {track.title}
        </p>
        <p className="text-charcoal/50 text-[10px] uppercase tracking-widest font-bold truncate mt-0.5">
          {track.artist}
        </p>
      </div>

      <button
        onClick={handleAdd}
        disabled={added || isAdding}
        aria-label={added ? `${track.title} added` : `Add ${track.title} to queue`}
        className={`
          flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center
          transition-all duration-300
          ${added
            ? 'bg-charcoal border-charcoal text-cream scale-95'
            : isAdding
              ? 'border-charcoal/20 text-charcoal/20 cursor-wait'
              : 'bg-transparent border-charcoal/25 text-charcoal/40 hover:border-charcoal hover:text-charcoal active:scale-95'
          }
          ${isPopping ? 'animate-haptic-pop' : ''}
        `}
      >
        {added ? (
          // Checkmark
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : isAdding ? (
          // Spinner
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          // Plus
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4v16M4 12h16" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── SearchOverlay ────────────────────────────────────────────────────────────

export default function SearchOverlay({ isOpen, onClose, venueId, uid }: SearchOverlayProps) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<SpotifyTrack[]>([]);
  const [mounted, setMounted]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Swipe-to-dismiss ─────────────────────────────────────────────────────
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY]         = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startY;
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 150) {
      onClose();
    }
    setDragOffset(0);
    setIsDragging(false);
  };

  // ── Debounced Spotify search ─────────────────────────────────────────────
  // Waits 350 ms after the user stops typing before hitting the Server Action.
  // useTransition keeps the UI responsive while the fetch is in-flight.

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const tracks = await searchSpotify(query);
        setResults(tracks);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // ── Mount / unmount gate ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setMounted(false);
        setQuery('');
        setResults([]);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Add to queue ─────────────────────────────────────────────────────────

  const handleAddTrack = async (track: SpotifyTrack) => {
    if (!uid) {
      console.warn('[VibeQueue] Cannot add track — auth not resolved yet.');
      return;
    }
    await requestSong(venueId, track, uid);
  };

  if (!mounted && !isOpen) return null;

  // ── Render ───────────────────────────────────────────────────────────────

  const showEmpty   = query.trim().length < 2;
  const showNoMatch = query.trim().length >= 2 && !isPending && results.length === 0;
  const showResults = results.length > 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`
        fixed inset-0 z-[100]
        bg-cream/93 backdrop-blur-2xl
        flex flex-col pb-safe
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* Handle for swipe-down indication */}
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
        <div className="w-12 h-1 bg-charcoal/10 rounded-full" />
      </div>
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

          {/* Spinner while Spotify request is in-flight */}
          {isPending && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-charcoal/30 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {/* Clear button */}
          {query.length > 0 && !isPending && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
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

        {showEmpty && (
          <div className="flex flex-col items-center justify-center h-full pb-24 gap-4">
            <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7 text-charcoal/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-charcoal/30 font-sans text-sm text-center max-w-[200px] leading-relaxed">
              Type at least 2 characters to search Spotify.
            </p>
          </div>
        )}

        {showNoMatch && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-charcoal/40 font-display text-sm uppercase tracking-widest">
              No results
            </p>
            <p className="text-charcoal/25 font-sans text-xs text-center">
              Try a different title or artist name.
            </p>
          </div>
        )}

        {showResults && (
          <div className="py-3">
            <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-charcoal/30 mb-3">
              {results.length} Result{results.length !== 1 ? 's' : ''} · Spotify
            </p>
            {results.map((track) => (
              <SearchResultCard
                key={track.id}
                track={track}
                onAdd={handleAddTrack}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
