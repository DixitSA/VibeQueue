'use client';

// ─── ConnectionCard ───────────────────────────────────────────────────────────
// Shows Spotify connection status. If disconnected, renders the OAuth button.
// If connected, shows the active device selector.

import React, { useEffect, useState, useTransition } from 'react';
import { getDevices, transferPlayback } from '@/lib/spotifyAdmin';
import { updateVenueSettings } from '@/lib/venueSettings';
import type { SpotifyDevice, VenueSettings } from '@/types';

interface ConnectionCardProps {
  venueId:  string;
  settings: VenueSettings;
}

export default function ConnectionCard({ venueId, settings }: ConnectionCardProps) {
  const [devices, setDevices]       = useState<SpotifyDevice[]>([]);
  const [isPending, startTransition] = useTransition();

  // Load devices once connected
  useEffect(() => {
    if (!settings.spotifyConnected) return;
    startTransition(async () => {
      try {
        const list = await getDevices(venueId);
        setDevices(list);
      } catch {
        // Token may not be valid yet — silently ignore, user can refresh
      }
    });
  }, [venueId, settings.spotifyConnected]);

  const handleDeviceSelect = async (deviceId: string) => {
    startTransition(async () => {
      await transferPlayback(venueId, deviceId);
      await updateVenueSettings(venueId, { activeDeviceId: deviceId });
    });
  };

  const handleRefreshDevices = () => {
    startTransition(async () => {
      const list = await getDevices(venueId);
      setDevices(list);
    });
  };

  // ── Not connected ───────────────────────────────────────────────────────────
  if (!settings.spotifyConnected) {
    return (
      <div className="bg-cream/5 border border-cream/10 rounded-sm p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {/* Spotify logo glyph */}
          <div className="w-10 h-10 rounded-full bg-cream/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-cream/40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-cream font-display font-semibold text-sm">Spotify Disconnected</h3>
            <p className="text-cream/40 text-xs mt-0.5">Connect a Premium account to control playback</p>
          </div>
        </div>

        <a
          href={`/api/spotify/auth?venueId=${venueId}`}
          className="
            w-full px-6 py-4 rounded-sm
            bg-cream text-charcoal
            font-display font-bold text-xs sm:text-sm uppercase tracking-widest
            flex items-center justify-center gap-2
            hover:bg-white transition-colors active:scale-[0.98]
            text-center leading-tight
          "
        >
          Connect Spotify Premium
        </a>
      </div>
    );
  }

  // ── Connected ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-cream/5 border border-cream/10 rounded-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
          <span className="text-cream font-display font-semibold text-sm">Spotify Connected</span>
        </div>
        <button
          onClick={handleRefreshDevices}
          disabled={isPending}
          className="text-cream/30 hover:text-cream/60 transition-colors disabled:opacity-30"
          aria-label="Refresh devices"
        >
          <svg className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Device selector */}
      <div>
        <label className="text-[9px] uppercase tracking-[0.3em] text-cream/30 font-bold font-display block mb-2">
          Active Output
        </label>
        {devices.length === 0 ? (
          <p className="text-cream/30 text-xs">No devices found — open Spotify on any device.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {devices.map((device) => (
              <button
                key={device.id}
                onClick={() => handleDeviceSelect(device.id)}
                disabled={isPending}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-sm border text-left
                  transition-all duration-150 active:scale-[0.98] disabled:opacity-50
                  ${device.id === settings.activeDeviceId
                    ? 'border-emerald/40 bg-emerald/10 text-cream'
                    : 'border-cream/10 bg-cream/5 text-cream/60 hover:border-cream/20 hover:text-cream'
                  }
                `}
              >
                {/* Device type icon */}
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  {device.type === 'Smartphone' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15h3" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                  )}
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm truncate">{device.name}</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-50">{device.type}{device.isActive ? ' · Active' : ''}</p>
                </div>
                {device.id === settings.activeDeviceId && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
