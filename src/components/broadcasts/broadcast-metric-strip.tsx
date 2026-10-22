'use client';

import React from 'react';

interface BroadcastMetricStripProps {
  totalRecipients: number;
  phoneReadyCount: number;
  pendingRsvpCount: number;
  attendingCount: number;
}

export function BroadcastMetricStrip({
  totalRecipients,
  phoneReadyCount,
  pendingRsvpCount,
  attendingCount,
}: BroadcastMetricStripProps) {
  const metrics = [
    {
      label: 'Target Audience',
      value: totalRecipients,
      icon: '👥',
      subtext: 'Filtered guests',
      color: 'from-amber-50 to-orange-50 border-amber-200/80 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      badgeText: 'Recipients',
    },
    {
      label: 'WhatsApp Ready',
      value: phoneReadyCount,
      icon: '💬',
      subtext: 'Valid phone numbers',
      color: 'from-emerald-50 to-teal-50 border-emerald-200/80 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      badgeText: `${totalRecipients > 0 ? Math.round((phoneReadyCount / totalRecipients) * 100) : 0}%`,
    },
    {
      label: 'Pending RSVPs',
      value: pendingRsvpCount,
      icon: '⏳',
      subtext: 'Awaiting confirmation',
      color: 'from-purple-50 to-pink-50 border-purple-200/80 text-purple-900',
      badgeColor: 'bg-purple-100 text-purple-800',
      badgeText: 'Needs Nudge',
    },
    {
      label: 'Attending Headcount',
      value: attendingCount,
      icon: '🍽️',
      subtext: 'Confirmed plates',
      color: 'from-rose-50 to-red-50 border-rose-200/80 text-rose-900',
      badgeColor: 'bg-rose-100 text-rose-800',
      badgeText: 'Attending',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className={`rounded-2xl border bg-gradient-to-br ${m.color} p-4 sm:p-5 shadow-xs transition-transform hover:-translate-y-0.5`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl" role="img" aria-label={m.label}>
              {m.icon}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
              {m.badgeText}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-zinc-900">
            {m.value}
          </p>
          <p className="text-xs font-semibold text-zinc-800 mt-0.5">{m.label}</p>
          <p className="text-[11px] text-zinc-500 mt-1">{m.subtext}</p>
        </div>
      ))}
    </div>
  );
}
