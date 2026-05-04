'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlbumArtProps {
  src: string;
  alt: string;
  /** sm = 40px · md = 48px · lg = 56px */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE: Record<NonNullable<AlbumArtProps['size']>, { wrapper: string; ring: string; mid: string; inner: string; dot: string; center: string }> = {
  sm: {
    wrapper: 'w-10 h-10',
    ring:   'w-7 h-7',
    mid:    'w-5 h-5',
    inner:  'w-3.5 h-3.5',
    dot:    'w-2.5 h-2.5',
    center: 'w-1 h-1',
  },
  md: {
    wrapper: 'w-12 h-12',
    ring:   'w-9 h-9',
    mid:    'w-6 h-6',
    inner:  'w-4 h-4',
    dot:    'w-3 h-3',
    center: 'w-1 h-1',
  },
  lg: {
    wrapper: 'w-14 h-14',
    ring:   'w-11 h-11',
    mid:    'w-7 h-7',
    inner:  'w-5 h-5',
    dot:    'w-3.5 h-3.5',
    center: 'w-1.5 h-1.5',
  },
};

// ─── Vinyl fallback ───────────────────────────────────────────────────────────
// Pure CSS vinyl record — concentric groove rings around an emerald centre label.
// No images, no emoji, no broken icons.

function VinylFallback({ size }: { size: NonNullable<AlbumArtProps['size']> }) {
  const s = SIZE[size];
  return (
    <div
      className={`${s.wrapper} flex-shrink-0 rounded-[2px] bg-[#1C1C1C] flex items-center justify-center overflow-hidden`}
      aria-hidden="true"
    >
      {/* Outer groove */}
      <div className={`relative ${s.ring} rounded-full border border-[#10B981]/15 flex items-center justify-center`}>
        {/* Mid groove */}
        <div className={`absolute ${s.mid} rounded-full border border-[#10B981]/20`} />
        {/* Inner groove */}
        <div className={`absolute ${s.inner} rounded-full border border-[#10B981]/25`} />
        {/* Centre label */}
        <div className={`relative ${s.dot} rounded-full bg-[#10B981]/25 flex items-center justify-center`}>
          <div className={`${s.center} rounded-full bg-[#10B981]/60`} />
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
// Uses a plain <img> (not next/image) so that arbitrary Spotify CDN URLs are
// handled gracefully — onError fires before any broken-image icon appears.

export default function AlbumArt({ src, alt, size = 'md', className = '' }: AlbumArtProps) {
  const [hasError, setHasError] = useState(!src || src.trim() === '');
  const s = SIZE[size];

  if (hasError) {
    return <VinylFallback size={size} />;
  }

  return (
    <div
      className={`${s.wrapper} flex-shrink-0 rounded-[2px] bg-[#1C1C1C] overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
