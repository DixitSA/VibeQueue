'use client';

// ─── Venue Command Center — /admin ────────────────────────────────────────────
// Split-screen admin dashboard:
//   Left  → AdminPlayer  (Now Playing + Master Skip + Device Selector)
//   Right → ModerationQueue (live queue, trash, approve/reject)
//   Below → ApprovalToggle + VibeSettings + ConnectionCard

import React from 'react';
import { useVenueSettings } from '@/hooks/useVenueSettings';
import ConnectionCard   from '@/components/admin/ConnectionCard/ConnectionCard';
import AdminPlayer      from '@/components/admin/AdminPlayer/AdminPlayer';
import ModerationQueue  from '@/components/admin/ModerationQueue/ModerationQueue';
import ApprovalToggle   from '@/components/admin/ApprovalToggle/ApprovalToggle';
import VibeSettings     from '@/components/admin/VibeSettings/VibeSettings';

// Venue ID — driven by env var so the same codebase serves multiple venues.
const VENUE_ID = process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST';

export default function AdminPage() {
  const { settings, loading } = useVenueSettings(VENUE_ID);

  return (
    <div className="min-h-screen bg-charcoal flex flex-col">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-cream/[0.07] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald" />
          <h1 className="text-cream font-display font-bold text-lg tracking-tight">
            VibeQueue
          </h1>
          <span className="text-cream/20 font-display text-xs uppercase tracking-widest">
            Command Center
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-cream/30 font-display text-xs uppercase tracking-widest">
            {VENUE_ID}
          </span>
          {loading && (
            <svg className="w-3.5 h-3.5 text-cream/20 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
        </div>
      </header>

      {/* ── Split-screen main area ───────────────────────────────────────── */}
      {/*  On mobile: stacked. On lg+: side-by-side.                         */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-cream/[0.07]">

        {/* ── Left panel: Live Player ────────────────────────────────────── */}
        <div className="flex flex-col overflow-y-auto">
          <AdminPlayer
            venueId={VENUE_ID}
            spotifyConnected={settings.spotifyConnected}
          />
        </div>

        {/* ── Right panel: Moderation Queue ─────────────────────────────── */}
        <div className="flex flex-col overflow-y-auto min-h-[480px] lg:min-h-0">
          <ModerationQueue
            venueId={VENUE_ID}
            manualApprovalMode={settings.manualApprovalMode}
          />
        </div>
      </div>

      {/* ── Bottom settings strip ────────────────────────────────────────── */}
      <div className="border-t border-cream/[0.07] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-cream/[0.07]">

        {/* Spotify connection */}
        <div className="p-6">
          <ConnectionCard venueId={VENUE_ID} settings={settings} />
        </div>

        {/* Approval workflow */}
        <div className="p-6">
          <ApprovalToggle
            venueId={VENUE_ID}
            manualApprovalMode={settings.manualApprovalMode}
          />
        </div>

        {/* Vibe filter */}
        <div className="p-6">
          <VibeSettings venueId={VENUE_ID} settings={settings} />
        </div>
      </div>

    </div>
  );
}
