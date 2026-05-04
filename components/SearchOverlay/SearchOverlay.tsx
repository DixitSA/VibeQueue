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

// ─── Constants ────────────────────────────────────────────────────────────────

const TRENDING_TRACKS: SpotifyTrack[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', albumArt: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop' },
  { id: '2', title: 'Starboy', artist: 'The Weeknd', albumArt: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=200&auto=format&fit=crop' },
  { id: '3', title: 'Blinding Lights', artist: 'The Weeknd', albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop' },
];

// ─── SearchResultCard ─────────────────────────────────────────────────────────

function SearchResultCard({
  track,
  onAdd,
  index = 0,
}: {
  track: SpotifyTrack;
  onAdd: (track: SpotifyTrack) => Promise<void>;
  index?: number;
}) {
  const [added, setAdded]       = useState(false);
  const [isPopping, setIsPopping] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (added || isAdding) return;

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
    <div 
      style={{ animationDelay: `${index * 50}ms` }}
      className="flex items-center gap-4 py-4 border-b border-charcoal/[0.05] last:border-0 animate-slide-up opacity-0"
    >
      <div className="relative group">
        <AlbumArt src={track.albumArt} alt={track.title} size="sm" />
        {added && (
          <div className="absolute inset-0 bg-emerald/80 flex items-center justify-center rounded-sm animate-in fade-in zoom-in duration-300">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-charcoal font-display font-bold text-base truncate leading-none mb-1">
          {track.title}
        </p>
        <p className="text-charcoal/40 font-sans text-[9px] uppercase tracking-[0.18em] font-bold truncate">
          {track.artist}
        </p>
      </div>

      <button
        onClick={handleAdd}
        disabled={added || isAdding}
        className={`
          flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center
          transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
          ${added
            ? 'bg-emerald border-emerald text-white scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            : isAdding
              ? 'border-charcoal/10 text-charcoal/10 cursor-wait'
              : 'bg-transparent border-charcoal/10 text-charcoal/30 hover:border-charcoal hover:text-charcoal active:scale-90 active:bg-charcoal/5'
          }
          ${isPopping ? 'animate-haptic-pop' : ''}
        `}
      >
        {added ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : isAdding ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
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
    if (!uid) return;
    await requestSong(venueId, track, uid);
  };

  if (!mounted && !isOpen) return null;

  // ── Render ───────────────────────────────────────────────────────────────

  const showOnboarding = query.trim().length < 1;
  const showNoMatch    = query.trim().length >= 2 && !isPending && results.length === 0;
  const showResults    = results.length > 0;

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
        bg-cream/93 backdrop-blur-3xl
        flex flex-col pb-safe
        transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
        <div className="w-12 h-1 bg-charcoal/10 rounded-full" />
      </div>

      <div className="flex items-center justify-between px-6 pt-14 pb-2">
        <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-charcoal/35 font-display">
          Music Search
        </p>
        <button
          onClick={onClose}
          className="text-charcoal/40 font-display text-[10px] uppercase tracking-widest font-bold hover:text-charcoal transition-colors px-2 py-1"
        >
          Close
        </button>
      </div>

      <div className="px-6 pt-3 pb-6">
        <h2 className="text-charcoal font-display text-5xl font-bold tracking-tighter leading-none mb-6">
          Find your Vibe.
        </h2>

        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists or tracks…"
            className="
              w-full bg-transparent
              border-b-2 border-charcoal/10 focus:border-charcoal
              outline-none px-0 py-4
              text-charcoal font-display text-2xl font-medium
              placeholder:text-charcoal/20
              transition-all duration-300
            "
          />

          {isPending && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <svg className="w-6 h-6 text-charcoal/20 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}

          {query.length > 0 && !isPending && (
            <button
              onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-charcoal/20 hover:text-charcoal transition-colors bg-charcoal/5 rounded-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 hide-scrollbar">
        {showOnboarding && (
          <div className="py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/30 mb-6 border-l-2 border-charcoal/10 pl-3">
              Trending at Demo Taproom
            </p>
            <div className="space-y-1">
              {TRENDING_TRACKS.map((track, i) => (
                <SearchResultCard 
                  key={track.id} 
                  track={track} 
                  onAdd={handleAddTrack} 
                  index={i}
                />
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-charcoal/5 rounded-sm border border-charcoal/[0.03]">
              <p className="text-charcoal/40 text-xs leading-relaxed font-sans italic">
                "Music is the shorthand of emotion." — Leo Tolstoy
              </p>
            </div>
          </div>
        )}

        {showNoMatch && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 animate-in fade-in duration-500">
            <p className="text-charcoal/40 font-display text-sm uppercase tracking-[0.2em] font-bold">
              No results found
            </p>
            <p className="text-charcoal/20 font-sans text-xs text-center max-w-[200px]">
              We couldn't find any matches. Check your spelling or try another vibe.
            </p>
          </div>
        )}

        {showResults && (
          <div className="py-6">
            <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-charcoal/25 mb-6">
              Spotify Global Results
            </p>
            <div className="space-y-1">
              {results.map((track, i) => (
                <SearchResultCard
                  key={track.id}
                  track={track}
                  onAdd={handleAddTrack}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
