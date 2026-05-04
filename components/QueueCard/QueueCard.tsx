'use client';

import React, { useState } from 'react';
import AlbumArt from '../AlbumArt/AlbumArt';
import { incrementUpvote } from '@/lib/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QueueCardProps {
  id: string;
  venueId: string;
  trackName: string;
  artistName: string;
  albumArt: string;
  upvotes: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QueueCard({
  id,
  venueId,
  trackName,
  artistName,
  albumArt,
  upvotes,
}: QueueCardProps) {
  const [isFlipped, setIsFlipped]               = useState(false);
  const [isUpvoted, setIsUpvoted]               = useState(false);
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(upvotes);
  const [isJumping, setIsJumping]               = useState(false);
  const [isPopping, setIsPopping]               = useState(false);

  // Swipe-to-upvote gesture
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping]     = useState(false);
  const [startX, setStartX]           = useState(0);

  // ── Upvote logic ────────────────────────────────────────────────────────────
  // Optimistic UI: apply the +1 immediately, then write to Firestore.
  // On network failure, roll back both the count and the upvoted state.

  const triggerUpvote = async () => {
    if (isUpvoted) return;

    // 1. Optimistic update
    setIsUpvoted(true);
    setOptimisticUpvotes((prev) => prev + 1);
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 400);

    // 2. Persist to Firestore
    try {
      await incrementUpvote(venueId, id);
    } catch (err) {
      // 3. Rollback on failure
      console.error('[VibeQueue] Upvote write failed — rolling back:', err);
      setIsUpvoted(false);
      setOptimisticUpvotes((prev) => prev - 1);
    }
  };

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger haptic pop animation on every press (re-sets via rAF trick)
    setIsPopping(false);
    requestAnimationFrame(() => {
      setIsPopping(true);
      setTimeout(() => setIsPopping(false), 350);
    });
    triggerUpvote();
  };

  // ── Swipe gesture ───────────────────────────────────────────────────────────

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFlipped) return;
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || isUpvoted || isFlipped) return;
    const diff = e.touches[0].clientX - startX;
    if (diff > 0) setSwipeOffset(Math.min(diff, 120));
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (swipeOffset > 60 && !isUpvoted) triggerUpvote();
    setSwipeOffset(0);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsFlipped(!isFlipped);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setIsFlipped(!isFlipped)}
      aria-label={`Flip card for ${trackName} by ${artistName}`}
      className={`
        text-left appearance-none block relative w-full h-[80px]
        perspective-1000 cursor-pointer mb-3
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-emerald
        focus:ring-offset-2 focus:ring-offset-charcoal rounded-sm
        ${isUpvoted ? 'scale-[1.02]' : ''}
      `}
    >
      {/* ── Swipe reveal background ──────────────────────────────────────── */}
      <div className="absolute inset-0 bg-emerald rounded-sm flex items-center px-6 shadow-inner z-0">
        <span className="text-charcoal font-display font-bold text-sm uppercase tracking-widest">
          Upvote
        </span>
      </div>

      {/* ── 3-D flip container ───────────────────────────────────────────── */}
      <div
        className={`relative z-10 w-full h-full card-container preserve-3d shadow-3d rounded-sm ${isFlipped ? 'card-flipped' : ''}`}
        style={{
          transform:  isSwiping ? `translateX(${swipeOffset}px) rotateY(0deg)` : undefined,
          transition: isSwiping ? 'none' : '',
        }}
      >
        {/* ── Front face ──────────────────────────────────────────────────── */}
        <div
          className={`
            absolute inset-0 backface-hidden bg-cream
            px-4 py-3 flex items-center gap-4 rounded-sm
            transition-all duration-300
            ${isUpvoted ? 'ring-2 ring-emerald/30' : ''}
          `}
        >
          <AlbumArt src={albumArt} alt={trackName} size="md" />

          <div className="flex-1 min-w-0">
            <h3 className="text-charcoal font-display font-semibold text-base truncate leading-tight mb-0.5">
              {trackName}
            </h3>
            <p className="text-charcoal/60 text-[10px] truncate uppercase tracking-widest font-bold">
              {artistName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isFlipped && (
              <div className="flex items-center opacity-40">
                <span className="text-[7px] uppercase font-bold tracking-[0.2em] text-charcoal mr-1 hidden sm:inline-block">
                  Tap
                </span>
                <svg className="w-3 h-3 text-charcoal animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}

            <div className="flex flex-col items-center border-l border-charcoal/10 pl-3 min-w-[36px]">
              <span
                className={`text-charcoal font-display text-lg font-bold leading-none ${
                  isJumping ? 'animate-number-jump text-emerald' : ''
                }`}
              >
                {optimisticUpvotes}
              </span>
              <span className="text-charcoal/40 text-[8px] uppercase font-bold mt-0.5 tracking-wider">
                Votes
              </span>
            </div>
          </div>
        </div>

        {/* ── Back face ───────────────────────────────────────────────────── */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-charcoal border border-cream/20 px-4 py-3 flex items-center justify-between rounded-sm">
          <div className="flex flex-col">
            <span
              className={`text-cream font-display text-2xl font-bold transition-colors ${
                isUpvoted ? 'text-emerald' : ''
              }`}
            >
              {optimisticUpvotes}
            </span>
            <span className="text-cream/50 text-[10px] uppercase tracking-widest font-bold">
              Total Upvotes
            </span>
          </div>

          <button
            disabled={isUpvoted}
            onClick={handleUpvote}
            className={`
              px-6 py-2 rounded-full font-display font-bold text-xs uppercase tracking-widest
              transition-all duration-300
              ${isUpvoted
                ? 'bg-emerald text-charcoal opacity-80'
                : 'bg-cream text-charcoal hover:bg-white'
              }
              ${isPopping ? 'animate-haptic-pop' : ''}
            `}
          >
            {isUpvoted ? 'Upvoted ✓' : 'Upvote'}
          </button>
        </div>
      </div>
    </div>
  );
}
