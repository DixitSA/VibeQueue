'use client';

// ─── ModerationQueue ──────────────────────────────────────────────────────────
// Right panel of the Command Center.
// Shows approved songs with a trash icon, and (if manual approval is on)
// a Pending section with Approve / Reject controls.

import React, { useState } from 'react';
import AlbumArt from '@/components/AlbumArt/AlbumArt';
import { deleteSong, updateSongStatus } from '@/lib/venueActions';
import { useModerationQueue } from '@/hooks/useModerationQueue';
import type { QueuedSong } from '@/types';

interface ModerationQueueProps {
  venueId:            string;
  manualApprovalMode: boolean;
}

// ── Song row ──────────────────────────────────────────────────────────────────

function SongRow({
  song,
  venueId,
  showApproval,
}: {
  song:         QueuedSong;
  venueId:      string;
  showApproval: boolean;
}) {
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try { await deleteSong(venueId, song.id); }
    catch (e) { console.error('[VibeQueue] Delete failed:', e); setIsDeleting(false); }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try { await updateSongStatus(venueId, song.id, 'approved'); }
    catch (e) { console.error('[VibeQueue] Approve failed:', e); setIsApproving(false); }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try { await deleteSong(venueId, song.id); }
    catch (e) { console.error('[VibeQueue] Reject failed:', e); setIsRejecting(false); }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-cream/[0.06] last:border-0">
      <AlbumArt src={song.albumArt} alt={song.title} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-cream font-display font-semibold text-sm truncate leading-snug">
          {song.title}
        </p>
        <p className="text-cream/40 text-[10px] uppercase tracking-widest font-bold truncate mt-0.5">
          {song.artist}
        </p>
      </div>

      {/* Vote count */}
      <span className="text-cream/40 font-display text-sm font-bold tabular-nums min-w-[28px] text-right">
        {song.upvoteCount}
      </span>

      {/* Approval controls (pending songs only) */}
      {showApproval && (
        <>
          {/* Approve — Emerald */}
          <button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            aria-label={`Approve ${song.title}`}
            className="
              min-w-[72px] h-11 px-3 rounded-sm
              bg-emerald/15 border border-emerald/30 text-emerald
              font-display font-bold text-[10px] uppercase tracking-widest
              hover:bg-emerald/25 active:scale-95
              transition-all duration-150 disabled:opacity-40
              flex items-center justify-center
            "
          >
            {isApproving ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : 'Approve'}
          </button>

          {/* Reject — Charcoal */}
          <button
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            aria-label={`Reject ${song.title}`}
            className="
              min-w-[72px] h-11 px-3 rounded-sm
              bg-cream/5 border border-cream/15 text-cream/50
              font-display font-bold text-[10px] uppercase tracking-widest
              hover:bg-cream/10 hover:text-cream/80 active:scale-95
              transition-all duration-150 disabled:opacity-40
              flex items-center justify-center
            "
          >
            {isRejecting ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : 'Reject'}
          </button>
        </>
      )}

      {/* Trash — always visible on approved rows */}
      {!showApproval && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Remove ${song.title} from queue`}
          className="
            w-11 h-11 rounded-sm flex items-center justify-center
            text-cream/20 hover:text-cream/60 hover:bg-cream/5
            active:scale-95 transition-all duration-150
            disabled:opacity-30
          "
        >
          {isDeleting ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ModerationQueue({ venueId, manualApprovalMode }: ModerationQueueProps) {
  const { pending, approved, loading, error } = useModerationQueue(venueId);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-cream/30 font-sans text-sm">Queue unavailable — {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-baseline justify-between px-8 pt-8 pb-4 flex-shrink-0">
        <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">
          Moderation Queue
        </p>
        {!loading && (
          <span className="text-cream/30 font-display text-xs">
            {approved.length + pending.length} song{approved.length + pending.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {loading ? (
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-cream/5 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Pending section ─────────────────────────────────────────── */}
            {manualApprovalMode && pending.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-cream/30 font-bold font-display">
                    Awaiting Approval
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/70 animate-pulse" />
                  <span className="text-amber-400/70 text-[10px] font-bold">{pending.length}</span>
                </div>
                {pending.map((song) => (
                  <SongRow key={song.id} song={song} venueId={venueId} showApproval />
                ))}
              </div>
            )}

            {/* ── Approved / active section ──────────────────────────────── */}
            {approved.length > 0 ? (
              <div>
                {manualApprovalMode && pending.length > 0 && (
                  <p className="text-[9px] uppercase tracking-[0.3em] text-cream/30 font-bold font-display mb-3">
                    Active Queue
                  </p>
                )}
                {approved.map((song) => (
                  <SongRow key={song.id} song={song} venueId={venueId} showApproval={false} />
                ))}
              </div>
            ) : (
              !manualApprovalMode || pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <p className="text-cream/20 font-display text-sm uppercase tracking-widest">Queue is empty</p>
                </div>
              ) : null
            )}
          </>
        )}
      </div>
    </div>
  );
}
