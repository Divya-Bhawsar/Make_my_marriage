'use client';

import React from 'react';
import { ExpenseSummaryDTO } from '@/modules/expense/expense.service';
import { formatRupees, formatCompactRupees } from '@/shared/utils/currency';
import { ExpenseCategory } from '@/shared/constants';

interface ExpenseMetricStripProps {
  summary: ExpenseSummaryDTO | null;
  isLoading: boolean;
}

export const CATEGORY_META: Record<
  ExpenseCategory,
  { label: string; icon: string; bg: string; text: string; border: string; barColor: string }
> = {
  VENUE: { label: 'Venue & Lawn', icon: '🏰', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', barColor: '#d97706' },
  CATERING: { label: 'Catering & Halwai', icon: '🍲', bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200', barColor: '#ea580c' },
  PHOTOGRAPHY: { label: 'Photography', icon: '📸', bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', barColor: '#2563eb' },
  VIDEOGRAPHY: { label: 'Videography', icon: '🎥', bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-200', barColor: '#4f46e5' },
  DECORATION: { label: 'Floral & Mandap Decor', icon: '🌸', bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200', barColor: '#e11d48' },
  CLOTHING: { label: 'Outfits & Apparel', icon: '👗', bg: 'bg-fuchsia-50', text: 'text-fuchsia-900', border: 'border-fuchsia-200', barColor: '#c026d3' },
  JEWELLERY: { label: 'Jewellery', icon: '💎', bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-200', barColor: '#059669' },
  ENTERTAINMENT: { label: 'DJ & Sangeet', icon: '🎵', bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', barColor: '#9333ea' },
  INVITATIONS: { label: 'Invitations & Cards', icon: '💌', bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', barColor: '#dc2626' },
  GIFTS: { label: 'Shagun & Gifts', icon: '🎁', bg: 'bg-yellow-50', text: 'text-yellow-900', border: 'border-yellow-200', barColor: '#ca8a04' },
  TRAVEL: { label: 'Travel & Logistics', icon: '🚗', bg: 'bg-sky-50', text: 'text-sky-900', border: 'border-sky-200', barColor: '#0284c7' },
  MAKEUP: { label: 'Makeup & Mehndi', icon: '💄', bg: 'bg-pink-50', text: 'text-pink-900', border: 'border-pink-200', barColor: '#db2777' },
  OTHER: { label: 'Miscellaneous', icon: '✨', bg: 'bg-zinc-50', text: 'text-zinc-900', border: 'border-zinc-200', barColor: '#71717a' },
};

export function ExpenseMetricStrip({ summary, isLoading }: ExpenseMetricStripProps) {
  if (isLoading || !summary) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const paidPercentage =
    summary.totalAgreedPaise > 0
      ? Math.min(100, Math.round((summary.totalPaidPaise / summary.totalAgreedPaise) * 100))
      : 0;

  const groomPayer = summary.byPayer.find((p) => p.payerSide === 'GROOM');
  const bridePayer = summary.byPayer.find((p) => p.payerSide === 'BRIDE');
  const sharedPayer = summary.byPayer.find((p) => p.payerSide === 'SHARED');

  return (
    <div className="rounded-3xl border-2 border-brand-sand/80 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">₹</span>
            <h2 className="text-lg font-serif font-bold text-zinc-900">
              Wedding Financial Overview
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time ledger summary of committed expenses, advance tokens, and pending balances
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 border border-amber-200">
          <span>🧾</span>
          <span>{summary.totalCount} Total Ledger {summary.totalCount === 1 ? 'Entry' : 'Entries'}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Committed Expense */}
        <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Budgeted / Agreed
            </span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-crimson">
            {formatRupees(summary.totalAgreedPaise)}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
            <span>Across all vendors & ceremonies</span>
          </div>
        </div>

        {/* Card 2: Advance Tokens Paid */}
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Advance Paid (Tokens)
            </span>
            <span className="text-lg">✅</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-700">
            {formatRupees(summary.totalPaidPaise)}
          </div>
          <div>
            <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
              <span>Settled</span>
              <span>{paidPercentage}%</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Balance Due */}
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Pending Due Balance
            </span>
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-rose-700">
            {formatRupees(summary.totalPendingPaise)}
          </div>
          <div className="text-[11px] text-rose-700 font-medium pt-1">
            {summary.totalPendingPaise > 0
              ? 'To be cleared before ceremonies'
              : 'All recorded payments cleared! 🎉'}
          </div>
        </div>

        {/* Card 4: Multi-Family Payer Split */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
              Payer Attribution Split
            </span>
            <span className="text-lg">🤝</span>
          </div>
          <div className="space-y-1.5 pt-1 text-xs font-semibold">
            <div className="flex items-center justify-between text-blue-900">
              <span className="flex items-center gap-1">
                <span>🎩</span>
                <span>Groom&apos;s Side:</span>
              </span>
              <span>{formatCompactRupees(groomPayer?.totalPaise || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-rose-900">
              <span className="flex items-center gap-1">
                <span>👰</span>
                <span>Bride&apos;s Side:</span>
              </span>
              <span>{formatCompactRupees(bridePayer?.totalPaise || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-purple-900">
              <span className="flex items-center gap-1">
                <span>🤝</span>
                <span>Joint / Shared:</span>
              </span>
              <span>{formatCompactRupees(sharedPayer?.totalPaise || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown Bar */}
      {summary.byCategory.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
            <span>Category Spending Distribution</span>
            <span className="text-zinc-500 font-normal">
              {summary.byCategory.length} active {summary.byCategory.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {/* Multi-segment Progress Bar */}
          <div className="h-3 w-full rounded-full bg-zinc-100 flex overflow-hidden shadow-inner">
            {summary.byCategory.map((cat) => {
              const meta = CATEGORY_META[cat.category] || CATEGORY_META.OTHER;
              const widthPct =
                summary.totalAgreedPaise > 0
                  ? (cat.totalPaise / summary.totalAgreedPaise) * 100
                  : 0;
              if (widthPct < 0.5) return null;
              return (
                <div
                  key={cat.category}
                  title={`${meta.label}: ${formatRupees(cat.totalPaise)} (${Math.round(widthPct)}%)`}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: meta.barColor,
                  }}
                  className="h-full transition-all hover:opacity-85"
                />
              );
            })}
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {summary.byCategory.map((cat) => {
              const meta = CATEGORY_META[cat.category] || CATEGORY_META.OTHER;
              return (
                <div
                  key={cat.category}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}:</span>
                  <span className="font-bold">{formatCompactRupees(cat.totalPaise)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
