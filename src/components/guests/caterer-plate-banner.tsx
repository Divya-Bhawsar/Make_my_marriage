'use client';

import React from 'react';

export interface PlateSummaryData {
  totalGuestsCount: number;
  totalCapacity: number;
  confirmedAttendingPlates: number;
  pendingCount: number;
  declinedCount: number;
  dietaryBreakdown: {
    ALL: number;
    PURE_VEG: number;
    JAIN: number;
    NON_VEG: number;
  };
  sideBreakdown: {
    GROOM: number;
    BRIDE: number;
    MUTUAL: number;
  };
  eventSummaries: Array<{
    eventId: string;
    name: string;
    type: string;
    startsAt: string;
    confirmedPlates: number;
  }>;
}

interface CatererPlateBannerProps {
  summary: PlateSummaryData | null;
  isLoading: boolean;
}

export function CatererPlateBanner({ summary, isLoading }: CatererPlateBannerProps) {
  if (isLoading || !summary) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs animate-pulse">
        <div className="h-6 w-48 bg-zinc-200 rounded-md mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-brand-sand/80 bg-white p-6 shadow-xs space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <h2 className="text-lg font-serif font-bold text-zinc-900">
              Caterer Plate & Headcount Calculator
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time plate counts to avoid caterer overbilling and food wastage
          </p>
        </div>

        {/* Dietary Distribution Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1">
            {`🌱 Pure Veg: ${summary.dietaryBreakdown.PURE_VEG}`}
          </span>
          <span className="rounded-lg bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1">
            {`🟡 Jain: ${summary.dietaryBreakdown.JAIN}`}
          </span>
          <span className="rounded-lg bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1">
            {`🍗 Non-Veg: ${summary.dietaryBreakdown.NON_VEG}`}
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Confirmed Plates */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-serif">
            {summary.confirmedAttendingPlates}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mt-1">
            Confirmed Plates
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Ready for Caterer</div>
        </div>

        {/* Card 2: Maximum Party Capacity */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-800 font-serif">
            {summary.totalCapacity}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 mt-1">
            Total Capacity
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">{summary.totalGuestsCount} Families</div>
        </div>

        {/* Card 3: Pending RSVPs */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-serif">
            {summary.pendingCount}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mt-1">
            Pending RSVPs
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting WhatsApp reply</div>
        </div>

        {/* Card 4: Declined */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-zinc-500 font-serif">
            {summary.declinedCount}
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mt-1">
            Declined
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Not Attending</div>
        </div>
      </div>

      {/* Per-Ceremony Plate Breakdown */}
      {summary.eventSummaries.length > 0 && (
        <div className="pt-2 border-t border-zinc-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block mb-2.5">
            Confirmed Plates Per Ceremony:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summary.eventSummaries.map((ev) => (
              <div
                key={ev.eventId}
                className="rounded-xl border border-brand-sand/60 bg-gradient-to-b from-brand-ivory/60 to-white p-3 text-center"
              >
                <div className="text-xs font-serif font-bold text-zinc-900 truncate">
                  {ev.name}
                </div>
                <div className="text-lg font-extrabold text-brand-crimson font-serif mt-1">
                  {ev.confirmedPlates}{' '}
                  <span className="text-[11px] font-normal text-zinc-500">plates</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
