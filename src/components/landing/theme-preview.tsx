/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { HERO_CONTENT, WEDDING_THEMES, WeddingTheme } from './landing-data';

export function ThemePreview() {
  const [activeTheme, setActiveTheme] = useState<WeddingTheme>(WEDDING_THEMES[0]);
  const { sampleWedding } = HERO_CONTENT;

  return (
    <div className="w-full">
      {/* Interactive Theme Switcher Bar for Bride & Groom */}
      <div className="mb-4 rounded-2xl bg-white/95 p-3.5 shadow-md border border-brand-sand/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
            <span className="text-base">🎨</span>
            <span>Choose Your Wedding Theme:</span>
          </span>
          <span className="text-[11px] font-semibold text-brand-gold italic">
            Interactive Preview
          </span>
        </div>

        {/* Theme Swatch Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {WEDDING_THEMES.map((theme) => {
            const isSelected = activeTheme.id === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveTheme(theme)}
                className={`flex items-center gap-2 rounded-xl p-2 text-left transition-all border ${
                  isSelected
                    ? `${theme.borderClass} bg-white shadow-md ring-2 ring-offset-1`
                    : 'border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300'
                }`}
                style={isSelected ? { outlineColor: theme.primaryHex } : {}}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full shadow-xs border border-white"
                  style={{ backgroundColor: theme.swatchColor }}
                />
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-zinc-900 truncate">
                    {theme.name.split(' ')[0]} {theme.name.split(' ')[1]}
                  </span>
                  <span className="block text-[9px] text-zinc-500 truncate">
                    {theme.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Preview Card Styled by Active Theme */}
      <div
        className={`relative mx-auto max-w-md lg:max-w-none rounded-3xl border-2 p-6 shadow-2xl backdrop-blur-md transition-all duration-300 bg-gradient-to-b ${activeTheme.bgGradient} ${activeTheme.borderClass}`}
      >
        {/* Couple Banner with Real Photo */}
        <div className="flex items-center gap-4 border-b border-zinc-200/60 pb-5">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-md">
            <img
              src={sampleWedding.couplePhotoUrl}
              alt="Divya and Rahul"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold font-serif text-zinc-900 truncate">
                {sampleWedding.couple}
              </h2>
              <span className="text-red-500 animate-pulse text-sm">❤️</span>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5">
              {sampleWedding.city} • {sampleWedding.date}
            </p>
          </div>

          <div className="shrink-0">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-xs border ${activeTheme.badgeClass}`}
            >
              {sampleWedding.daysToGo} Days to Go
            </span>
          </div>
        </div>

        {/* Ceremonies Itinerary with Visual Photo Thumbnails */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Ceremonies & Dress Codes
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">
              5 Functions Mapped
            </span>
          </div>

          <div className="space-y-2">
            {sampleWedding.ceremonies.slice(0, 3).map((ceremony) => (
              <div
                key={ceremony.name}
                className="flex items-center justify-between rounded-xl bg-white/90 p-2.5 shadow-xs border border-zinc-200/70 hover:border-zinc-300 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg shadow-xs">
                    <img
                      src={ceremony.photoUrl}
                      alt={ceremony.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block leading-tight">
                      {ceremony.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">{ceremony.time}</span>
                  </div>
                </div>

                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold border"
                  style={{
                    backgroundColor: `${ceremony.accentColor}15`,
                    color: ceremony.accentColor,
                    borderColor: `${ceremony.accentColor}30`,
                  }}
                >
                  {ceremony.theme}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Metrics Grid: Caterer Headcounts & Rupee Ledger */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-white/90 p-3.5 border border-zinc-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Caterer Plate Counts
            </span>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              {sampleWedding.confirmedGuests}{' '}
              <span className="text-xs font-normal text-zinc-500">
                / {sampleWedding.totalInvited}
              </span>
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              {sampleWedding.dietaryNotes}
            </span>
          </div>

          <div className="rounded-2xl bg-white/90 p-3.5 border border-zinc-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Expense Ledger
            </span>
            <p className={`mt-1 text-xl font-bold ${activeTheme.accentText}`}>
              {sampleWedding.budgetSpent}
            </p>
            <span className="text-[11px] text-zinc-500 font-medium block mt-0.5">
              {sampleWedding.bookedVendors}
            </span>
          </div>
        </div>

        {/* Active Theme Badge & Live Status Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5 font-medium text-zinc-700">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeTheme.primaryHex }}
            />
            <span>Theme: {activeTheme.name}</span>
          </span>
          <span className="font-serif italic font-semibold text-zinc-400">
            Make My Marriage
          </span>
        </div>
      </div>
    </div>
  );
}
