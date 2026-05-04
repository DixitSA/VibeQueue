'use client';

import React from 'react';

interface SearchFABProps {
  onClick: () => void;
}

/*
  "Vellum" FAB — spec:
  • Cream circle with Midnight Charcoal (+) icon
  • backdrop-blur-md so the background bleeds through slightly
  • 1 px solid charcoal border  →  feels like a physical object resting on glass
  • Layered box-shadows: ambient lift + key shadow + inner highlight ridge
  • active: collapses the shadow stack + slight scale-down (tactile press feel)
*/

export default function SearchFAB({ onClick }: SearchFABProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Search Spotify — add a song"
      className="
        fixed bottom-6 right-6 mb-safe z-40
        w-14 h-14 rounded-full
        bg-cream/95 backdrop-blur-md
        border border-charcoal
        flex items-center justify-center
        shadow-[0_6px_20px_rgba(28,28,28,0.22),0_2px_6px_rgba(28,28,28,0.12),inset_0_1px_0_rgba(255,255,255,0.85)]
        transition-all duration-150 ease-out
        hover:shadow-[0_8px_26px_rgba(28,28,28,0.28),0_3px_8px_rgba(28,28,28,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]
        active:scale-90
        active:shadow-[0_1px_4px_rgba(28,28,28,0.18),inset_0_1px_3px_rgba(28,28,28,0.08)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2
      "
    >
      <svg
        className="w-6 h-6 text-charcoal"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Plus icon */}
        <path d="M12 4v16M4 12h16" />
      </svg>
    </button>
  );
}
