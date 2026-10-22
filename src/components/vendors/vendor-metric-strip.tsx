'use client';

import React from 'react';
import { IVendorSummaryMetrics } from '@/modules/vendor/vendor.service';
import { formatRupees, formatCompactRupees } from '@/shared/utils/currency';
import { VENDOR_CATEGORIES } from '@/shared/constants';

interface VendorMetricStripProps {
  metrics: IVendorSummaryMetrics | null;
  loading?: boolean;
}

export const VENDOR_CATEGORY_META: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  PHOTOGRAPHER: { label: 'Photography', icon: '📷', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  VIDEOGRAPHER: { label: 'Cinematography', icon: '🎥', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  VENUE: { label: 'Wedding Venue', icon: '🏛️', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CATERER: { label: 'Catering & Halwai', icon: '🍽️', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  DECORATOR: { label: 'Decor & Mandap', icon: '🌸', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  DJ: { label: 'DJ & Sound', icon: '🎵', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  MAKEUP_ARTIST: { label: 'Bridal Makeup', icon: '💄', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  MEHENDI_ARTIST: { label: 'Mehendi Artist', icon: '🌿', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  PANDIT: { label: 'Pandit / Shastri', icon: '🪔', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CHOREOGRAPHER: { label: 'Choreography', icon: '💃', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  FLORIST: { label: 'Florals & Varmala', icon: '💐', bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
  WEDDING_PLANNER: { label: 'Wedding Planner', icon: '📋', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  TRANSPORT: { label: 'Transport & Fleet', icon: '🚗', bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-200' },
  OTHER: { label: 'Other Service', icon: '✨', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export function VendorMetricStrip({ metrics, loading }: VendorMetricStripProps) {
  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-brand-sand/50 rounded-xl" />
        ))}
      </div>
    );
  }

  const {
    totalVendors,
    totalAgreedPaise,
    totalPaidPaise,
    pendingBalancePaise,
    categoriesCount,
    archivedCount,
    categoryBreakdown,
  } = metrics;

  const totalCategories = VENDOR_CATEGORIES.length;
  const coveragePercent = Math.round((categoriesCount / totalCategories) * 100);

  return (
    <div className="space-y-4">
      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Booked Vendors */}
        <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-brand-charcoal/70 text-xs font-medium">
            <span>Booked Vendors</span>
            <span className="p-1.5 bg-brand-crimson/10 text-brand-crimson rounded-lg text-sm">🤝</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-charcoal font-serif">{totalVendors}</span>
            <span className="text-xs text-brand-charcoal/60">
              hired {archivedCount > 0 ? `(${archivedCount} archived)` : ''}
            </span>
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">Across wedding functions</p>
        </div>

        {/* Total Contracted Value */}
        <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-brand-charcoal/70 text-xs font-medium">
            <span>Total Contracted</span>
            <span className="p-1.5 bg-brand-gold/15 text-brand-gold rounded-lg text-sm">📜</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-charcoal font-serif">
              {formatCompactRupees(totalAgreedPaise)}
            </span>
            <span className="text-xs text-brand-charcoal/60" title={formatRupees(totalAgreedPaise)}>
              agreed
            </span>
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">{formatRupees(totalAgreedPaise)} total</p>
        </div>

        {/* Paid from Ledger */}
        <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-brand-charcoal/70 text-xs font-medium">
            <span>Paid from Ledger</span>
            <span className="p-1.5 bg-brand-emerald/10 text-brand-emerald rounded-lg text-sm">💸</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-emerald font-serif">
              {formatCompactRupees(totalPaidPaise)}
            </span>
            <span className="text-xs text-brand-charcoal/60">disbursed</span>
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">Via Rupee Expense Ledger</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white border border-brand-sand rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-brand-charcoal/70 text-xs font-medium">
            <span>Pending Balance</span>
            <span className="p-1.5 bg-brand-crimson/10 text-brand-crimson rounded-lg text-sm">⏳</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-crimson font-serif">
              {formatCompactRupees(pendingBalancePaise)}
            </span>
            <span className="text-xs text-brand-charcoal/60">due</span>
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">To settle upon completion</p>
        </div>
      </div>

      {/* Category Coverage Pill Strip */}
      <div className="bg-white/80 border border-brand-sand rounded-xl p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-charcoal uppercase tracking-wider">
              Service Category Coverage
            </span>
            <span className="px-2 py-0.5 bg-brand-gold/15 text-brand-gold text-xs font-medium rounded-full">
              {categoriesCount} of {totalCategories} categories ({coveragePercent}%)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {VENDOR_CATEGORIES.map((catKey) => {
            const meta = VENDOR_CATEGORY_META[catKey] || {
              label: catKey,
              icon: '✨',
              bg: 'bg-gray-50',
              text: 'text-gray-700',
              border: 'border-gray-200',
            };
            const breakdown = categoryBreakdown[catKey];
            const isCovered = Boolean(breakdown && breakdown.count > 0);

            return (
              <span
                key={catKey}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  isCovered
                    ? `${meta.bg} ${meta.text} ${meta.border} shadow-2xs`
                    : 'bg-gray-50/60 text-gray-400 border-gray-200/60 line-through opacity-70'
                }`}
                title={
                  isCovered
                    ? `${breakdown.count} vendor(s) • ${formatRupees(breakdown.totalPaise)}`
                    : 'Not yet booked'
                }
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                {isCovered && (
                  <span className="ml-0.5 font-bold px-1.5 py-0.2 bg-white/80 rounded-full text-[10px]">
                    {breakdown.count}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
