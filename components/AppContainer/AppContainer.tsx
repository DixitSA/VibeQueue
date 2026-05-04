'use client';

import React from 'react';

/**
 * Ensures a consistent mobile-optimized viewport for consumer-facing pages.
 */
export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-charcoal shadow-2xl relative flex flex-col">
      {children}
    </div>
  );
}
