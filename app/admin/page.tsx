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
import AdminGuard       from '@/components/admin/AdminGuard/AdminGuard';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { skipTrack } from '@/lib/spotifyAdmin';
import { updateVenueSettings } from '@/lib/venueSettings';

// Venue ID — driven by env var so the same codebase serves multiple venues.
const VENUE_ID = process.env.NEXT_PUBLIC_ADMIN_VENUE_ID ?? 'CHARLOTTE_TEST';

export default function AdminPage() {
  const { settings, loading } = useVenueSettings(VENUE_ID);
  const [activeTab, setActiveTab] = React.useState<'player' | 'queue'>('player');

  // Keyboard shortcuts
  useAdminShortcuts({
    onSkip: async () => {
      try { await skipTrack(VENUE_ID); } catch (e) { console.error('Keyboard skip failed:', e); }
    },
    onToggleApproval: async () => {
      try { await updateVenueSettings(VENUE_ID, { manualApprovalMode: !settings.manualApprovalMode }); }
      catch (e) { console.error('Keyboard approval toggle failed:', e); }
    },
    onSwitchTab: setActiveTab
  });

  return (
    <AdminGuard>
      <div className="h-screen bg-charcoal flex flex-col overflow-hidden select-none">

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-cream/[0.07] flex-shrink-0 bg-charcoal/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] ${settings.spotifyConnected ? 'bg-emerald animate-pulse' : 'bg-cream/10'}`} />
            <h1 className="text-cream font-display font-bold text-base tracking-tight">
              VibeQueue
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-cream/40 font-display text-[9px] uppercase tracking-widest font-bold">
                {settings.spotifyConnected ? 'System Live' : 'System Standby'}
              </span>
              <span className="text-cream/20 font-display text-[8px] uppercase tracking-[0.2em] font-bold mt-0.5">
                {VENUE_ID}
              </span>
            </div>
            {loading && (
              <div className="w-6 h-6 rounded-full border border-cream/5 flex items-center justify-center">
                <svg className="w-3 h-3 text-cream/20 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
            )}
          </div>
        </header>

        {/* ── Mobile Tab Switcher ────────────────────────────────────────── */}
        <div className="lg:hidden flex border-b border-cream/[0.07] bg-charcoal/40">
          <button 
            onClick={() => setActiveTab('player')}
            className={`flex-1 py-3 text-[10px] uppercase tracking-[0.2em] font-bold font-display transition-colors ${activeTab === 'player' ? 'text-emerald border-b border-emerald' : 'text-cream/30'}`}
          >
            Live Player
          </button>
          <button 
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-3 text-[10px] uppercase tracking-[0.2em] font-bold font-display transition-colors ${activeTab === 'queue' ? 'text-emerald border-b border-emerald' : 'text-cream/30'}`}
          >
            Moderation
          </button>
        </div>

        {/* ── Split-screen / Triple-pane main area ───────────────────────── */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 lg:divide-x divide-cream/[0.07] overflow-hidden">
          
          {/* Panel 1: Live Player (Billboard) */}
          <section className={`flex flex-col overflow-y-auto scrollbar-thin ${activeTab === 'player' ? 'flex' : 'hidden lg:flex'}`}>
            <AdminPlayer
              venueId={VENUE_ID}
              spotifyConnected={settings.spotifyConnected}
            />
          </section>

          {/* Panel 2: Moderation Queue */}
          <section className={`flex flex-col overflow-y-auto scrollbar-thin ${activeTab === 'queue' ? 'flex' : 'hidden lg:flex'}`}>
            <ModerationQueue
              venueId={VENUE_ID}
              manualApprovalMode={settings.manualApprovalMode}
            />
          </section>

          {/* Panel 3: Quick Settings (Desktop 2xl only) */}
          <section className="hidden 2xl:flex flex-col overflow-y-auto scrollbar-thin bg-black/10">
            <div className="p-8 space-y-10">
              <div className="space-y-4">
                <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">Control Center</p>
                <div className="grid gap-4">
                  <ConnectionCard venueId={VENUE_ID} settings={settings} />
                  <ApprovalToggle venueId={VENUE_ID} manualApprovalMode={settings.manualApprovalMode} />
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">Vibe Governance</p>
                <VibeSettings venueId={VENUE_ID} settings={settings} />
              </div>
            </div>
          </section>
        </main>

        {/* ── Bottom settings strip ────────────────────────────────────────── */}
        <footer className="2xl:hidden border-t border-cream/[0.07] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-cream/[0.07] bg-charcoal/90 backdrop-blur-xl pb-safe">
          <div className="flex-1 min-w-0 p-5 md:p-6">
            <ConnectionCard venueId={VENUE_ID} settings={settings} />
          </div>
          <div className="hidden md:flex flex-1 min-w-0 p-6">
            <ApprovalToggle
              venueId={VENUE_ID}
              manualApprovalMode={settings.manualApprovalMode}
            />
          </div>
          <div className="hidden lg:flex flex-1 min-w-0 p-6">
            <VibeSettings venueId={VENUE_ID} settings={settings} />
          </div>
        </footer>
      </div>
    </AdminGuard>
  );
}
