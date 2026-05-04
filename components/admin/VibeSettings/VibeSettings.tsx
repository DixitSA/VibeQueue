'use client';

// ─── VibeSettings ─────────────────────────────────────────────────────────────
// Tag-based multi-select for Forbidden Genres and Vibe Seeds.
// Saves to Firestore on each add/remove.

import React, { useState, useRef, KeyboardEvent } from 'react';
import { updateVenueSettings } from '@/lib/venueActions';
import type { VenueSettings } from '@/types';

interface VibeSettingsProps {
  venueId:  string;
  settings: VenueSettings;
}

// ── Tag pill ──────────────────────────────────────────────────────────────────

function Tag({ label, onRemove, color }: { label: string; onRemove: () => void; color: 'red' | 'emerald' }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-bold uppercase tracking-wider
        ${color === 'red'
          ? 'bg-red-900/20 border border-red-500/20 text-red-400/80'
          : 'bg-emerald/10 border border-emerald/20 text-emerald/80'
        }
      `}
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ── Tag input row ─────────────────────────────────────────────────────────────

function TagInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (value: string) => void;
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1 bg-transparent border-b border-cream/15 focus:border-cream/40
          outline-none py-2 px-0
          text-cream font-display text-sm
          placeholder:text-cream/20
          transition-colors duration-200
        "
      />
      <button
        onClick={commit}
        disabled={!value.trim()}
        className="
          px-3 py-2 rounded-sm text-xs font-display font-bold uppercase tracking-widest
          bg-cream/5 border border-cream/10 text-cream/40
          hover:bg-cream/10 hover:text-cream/60 active:scale-95
          disabled:opacity-30 transition-all duration-150
        "
      >
        Add
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VibeSettings({ venueId, settings }: VibeSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);

  const save = async (updates: Partial<Pick<VenueSettings, 'forbiddenGenres' | 'vibeSeeds'>>) => {
    setIsSaving(true);
    try {
      await updateVenueSettings(venueId, updates);
    } catch (e) {
      console.error('[VibeQueue] Failed to save vibe settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Forbidden genres ────────────────────────────────────────────────────
  const addForbidden = (genre: string) => {
    if (settings.forbiddenGenres.includes(genre)) return;
    save({ forbiddenGenres: [...settings.forbiddenGenres, genre] });
  };
  const removeForbidden = (genre: string) => {
    save({ forbiddenGenres: settings.forbiddenGenres.filter((g) => g !== genre) });
  };

  // ── Vibe seeds ──────────────────────────────────────────────────────────
  const addSeed = (seed: string) => {
    if (settings.vibeSeeds.includes(seed)) return;
    save({ vibeSeeds: [...settings.vibeSeeds, seed] });
  };
  const removeSeed = (seed: string) => {
    save({ vibeSeeds: settings.vibeSeeds.filter((s) => s !== seed) });
  };

  return (
    <div className="bg-cream/5 border border-cream/10 rounded-sm p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.35em] text-cream/30 font-bold font-display">
          Vibe Filter
        </p>
        {isSaving && (
          <svg className="w-3.5 h-3.5 text-cream/20 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
      </div>

      {/* Forbidden genres */}
      <div className="flex flex-col gap-3">
        <label className="text-cream/60 font-display font-semibold text-xs uppercase tracking-wider">
          Forbidden Genres
        </label>
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {settings.forbiddenGenres.map((genre) => (
            <Tag key={genre} label={genre} onRemove={() => removeForbidden(genre)} color="red" />
          ))}
          {settings.forbiddenGenres.length === 0 && (
            <span className="text-cream/20 text-xs italic">None set</span>
          )}
        </div>
        <TagInput placeholder="e.g. death metal, mumble rap…" onAdd={addForbidden} />
      </div>

      {/* Vibe seeds */}
      <div className="flex flex-col gap-3">
        <label className="text-cream/60 font-display font-semibold text-xs uppercase tracking-wider">
          Vibe Seeds
        </label>
        <div className="flex flex-wrap gap-2 min-h-[28px]">
          {settings.vibeSeeds.map((seed) => (
            <Tag key={seed} label={seed} onRemove={() => removeSeed(seed)} color="emerald" />
          ))}
          {settings.vibeSeeds.length === 0 && (
            <span className="text-cream/20 text-xs italic">None set</span>
          )}
        </div>
        <TagInput placeholder="e.g. indie rock, lo-fi, jazz…" onAdd={addSeed} />
      </div>
    </div>
  );
}
