'use client';

import React, { useState } from 'react';
import {
  CulturalPresetType,
  CULTURAL_PRESET_TYPES,
} from '@/modules/ai-planner/ai-planner.schema';
import { CulturalPresetDefinition } from '@/modules/ai-planner/ai-planner.service';

interface CulturalSchedulerProps {
  presets: CulturalPresetDefinition[];
  onApplySuccess: (msg: string) => void;
}

export function CulturalScheduler({
  presets,
  onApplySuccess,
}: CulturalSchedulerProps) {
  const [selectedCulture, setSelectedCulture] = useState<CulturalPresetType>(
    CULTURAL_PRESET_TYPES.NORTH_INDIAN_PUNJABI
  );
  const [isApplying, setIsApplying] = useState(false);
  const [appliedStatus, setAppliedStatus] = useState<string | null>(null);

  const activePreset =
    presets.find((p) => p.culture === selectedCulture) || presets[0];

  const handleApplyPreset = async () => {
    setIsApplying(true);
    setAppliedStatus(null);
    try {
      const res = await fetch('/api/ai-planner/cultural-presets/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ culture: selectedCulture }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to apply preset');
      }

      const msg = `Successfully added ${data.data.appliedCeremoniesCount} ceremonies and ${data.data.appliedTasksCount} ritual tasks to your workspace!`;
      setAppliedStatus(msg);
      onApplySuccess(msg);
    } catch (err: unknown) {
      setAppliedStatus(err instanceof Error ? err.message : 'Error applying ceremonies');
    } finally {
      setIsApplying(false);
    }
  };

  const cultureBadges: Record<string, { icon: string; tag: string }> = {
    NORTH_INDIAN_PUNJABI: { icon: '🔴', tag: 'Dhol & Jaggo' },
    MARWARI_RAJASTHANI: { icon: '🟡', tag: 'Mayra & Royalty' },
    GUJARATI: { icon: '🟠', tag: 'Mameru & Dandiya' },
    SOUTH_INDIAN: { icon: '🟢', tag: 'Kanchipuram & Oonjal' },
    MAHARASHTRIAN: { icon: '🔵', tag: 'Paithani & Mundavalya' },
    BENGALI: { icon: '🌸', tag: 'Shankha Pola & Topor' },
  };

  return (
    <div className="space-y-6">
      {/* Tradition Selector */}
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-zinc-900 flex items-center gap-2">
            <span>🪔</span>
            <span>Regional Cultural Rituals &amp; Auspicious Samagri</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Choose your cultural heritage to preview authentic ceremony workflows, sacred samagri lists, and 1-click import them into your wedding schedule.
          </p>
        </div>

        {/* Culture Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {presets.map((p) => {
            const isSelected = p.culture === selectedCulture;
            const meta = cultureBadges[p.culture] || { icon: '🪔', tag: 'Heritage' };

            return (
              <button
                key={p.culture}
                type="button"
                onClick={() => setSelectedCulture(p.culture)}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-brand-crimson bg-rose-50/60 ring-1 ring-brand-crimson/30 shadow-xs'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
                }`}
              >
                <div>
                  <span className="text-xl block mb-1">{meta.icon}</span>
                  <span className="font-serif font-bold text-xs text-zinc-900 block truncate">
                    {p.title.split(' / ')[0]}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 truncate block">{meta.tag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Tradition Detail & Ceremonies */}
      {activePreset && (
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {cultureBadges[activePreset.culture]?.icon || '🪔'}
                </span>
                <h3 className="font-serif font-bold text-lg text-zinc-900">
                  {activePreset.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">{activePreset.description}</p>
            </div>

            <button
              type="button"
              onClick={handleApplyPreset}
              disabled={isApplying}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-crimson hover:bg-brand-burgundy text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-60 shrink-0 self-start sm:self-auto"
            >
              {isApplying ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Applying to Workspace...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Import {activePreset.ceremonies.length} Ceremonies to Schedule</span>
                </>
              )}
            </button>
          </div>

          {appliedStatus && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <span>✓</span>
              <span>{appliedStatus}</span>
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="divide-y divide-zinc-100 p-4 sm:p-6 space-y-4 divide-y-0">
            {activePreset.ceremonies.map((ceremony, idx) => {
              const dayLabel =
                ceremony.dayOffset === 0
                  ? 'Wedding Day'
                  : ceremony.dayOffset < 0
                  ? `${Math.abs(ceremony.dayOffset)} Days Before`
                  : `${ceremony.dayOffset} Day After`;

              return (
                <div
                  key={ceremony.name}
                  className="rounded-2xl border border-zinc-200/80 p-4 sm:p-5 hover:border-brand-sand transition-all space-y-3 bg-zinc-50/30"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-xl bg-brand-crimson text-white text-xs font-bold flex items-center justify-center shadow-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-serif font-bold text-sm text-zinc-900">
                          {ceremony.name}
                        </h4>
                        <span className="text-[11px] text-zinc-500">
                          {dayLabel} &bull; Typical Slot: {ceremony.timeSlot}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 self-start sm:self-auto border border-amber-200">
                      Dress Code: {ceremony.dressCode}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {ceremony.significance}
                  </p>

                  {/* Samagri Checklist Pills */}
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                      Essential Sacred Samagri:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ceremony.samagriList.map((item) => (
                        <span
                          key={item}
                          className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-white border border-zinc-200 text-zinc-700"
                        >
                          🕉️ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
