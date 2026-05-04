'use client';

// ─── ApprovalToggle ───────────────────────────────────────────────────────────
// Persists manualApprovalMode to Firestore on toggle.

import React, { useState } from 'react';
import { updateVenueSettings } from '@/lib/venueSettings';

interface ApprovalToggleProps {
  venueId:            string;
  manualApprovalMode: boolean;
}

export default function ApprovalToggle({ venueId, manualApprovalMode }: ApprovalToggleProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    setIsSaving(true);
    try {
      await updateVenueSettings(venueId, { manualApprovalMode: !manualApprovalMode });
    } catch (e) {
      console.error('[VibeQueue] Failed to update approval mode:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-cream/5 border border-cream/10 rounded-sm p-6">
      {/* Section label */}
      <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display mb-4">
        Approval Workflow
      </p>

      <button
        role="switch"
        aria-checked={manualApprovalMode}
        aria-label="Toggle manual approval mode"
        onClick={handleToggle}
        disabled={isSaving}
        className="w-full flex items-center justify-between gap-4 group disabled:opacity-50"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-cream font-display font-semibold text-sm">
            Manual Approval Mode
          </span>
          <span className="text-cream/40 text-xs leading-relaxed text-left">
            {manualApprovalMode
              ? 'New requests are held for your review before appearing in the queue.'
              : 'New requests go straight to the queue — no review needed.'}
          </span>
        </div>

        {/* Toggle pill — large enough for bartender tap */}
        <div
          className={`
            relative flex-shrink-0 w-14 h-8 rounded-full border transition-all duration-200
            ${manualApprovalMode
              ? 'bg-emerald/20 border-emerald/40'
              : 'bg-cream/5 border-cream/15'
            }
          `}
        >
          <div
            className={`
              absolute top-1 w-6 h-6 rounded-full shadow-sm transition-all duration-200
              ${manualApprovalMode
                ? 'left-7 bg-emerald'
                : 'left-1 bg-cream/40'
              }
            `}
          />
        </div>
      </button>
    </div>
  );
}
