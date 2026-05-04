'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CurrentlyPlaying() {
  const [progress, setProgress] = useState(65); // Mock 65% progress

  // Optional: animate progress for demo feel
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.1));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="sticky top-0 z-50 glass-vellum backdrop-blur-md px-6 pt-safe pb-3 flex flex-col gap-0 border-b border-cream/10">
      <div className="flex items-center gap-3 mt-4 mb-2">
        <div className="relative">
          <div className="relative w-14 h-14 bg-cream/10 rounded-sm overflow-hidden flex-shrink-0 border border-cream/20">
            <Image 
              src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop" 
              alt="Current Track" 
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald rounded-full border-2 border-charcoal animate-pulse" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-display uppercase tracking-[0.2em] text-cream/50 mb-0.5">Now Playing</p>
          <h2 className="text-cream font-display text-lg font-medium truncate leading-tight">
            Midnight City
          </h2>
          <p className="text-cream/60 text-sm truncate">M83</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-cream/10">
        <div 
          className="h-full bg-emerald transition-all duration-300 ease-linear shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
}
