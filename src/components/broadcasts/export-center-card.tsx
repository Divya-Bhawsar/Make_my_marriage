'use client';

import React from 'react';

export function ExportCenterCard() {
  const exports = [
    {
      id: 'guests',
      title: 'Guest RSVP Manifest',
      subtitle: 'Official Guest List, RSVPs & Dietary Requirements',
      icon: '📋',
      badge: 'Excel / CSV',
      description:
        'Full roster of bride, groom, and mutual guests with confirmed headcount, pure veg/jain dietary tags, contact numbers, and ceremony invites.',
      downloadUrl: '/api/broadcasts/export/guests',
      filename: 'wedding-guests-manifest.csv',
      color: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200/80',
      buttonColor: 'bg-amber-700 hover:bg-amber-800 text-white',
    },
    {
      id: 'itinerary',
      title: 'Ceremony Logistics Run-Sheet',
      subtitle: 'Chronological Timeline, Venues & Themes',
      icon: '🪔',
      badge: 'Excel / CSV',
      description:
        'Minute-by-minute schedule of all wedding events with start/end times, venue addresses, dress codes, themes, and special instructions for vendors.',
      downloadUrl: '/api/broadcasts/export/itinerary',
      filename: 'wedding-ceremonies-itinerary.csv',
      color: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200/80',
      buttonColor: 'bg-brand-crimson hover:bg-brand-burgundy text-white',
    },
    {
      id: 'catering',
      title: 'Halwai & Catering Plate Orders',
      subtitle: 'Ceremony-by-Ceremony Meal Planning & Headcounts',
      icon: '🍲',
      badge: 'Excel / CSV',
      description:
        'Detailed plate counts per ceremony broken down by Pure Veg, Jain (no onion/garlic), and Non-Veg, including a +10% elder companion safety buffer.',
      downloadUrl: '/api/broadcasts/export/catering',
      filename: 'wedding-catering-plates-summary.csv',
      color: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200/80',
      buttonColor: 'bg-emerald-700 hover:bg-emerald-800 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif font-bold text-xl text-zinc-900">
          Printable Reports &amp; Spreadsheets
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Export pre-formatted CSV spreadsheets encoded with UTF-8 BOM for immediate use in Microsoft Excel,
          Google Sheets, or for handing to your wedding planner and halwai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exports.map((exp) => (
          <div
            key={exp.id}
            className={`rounded-3xl border bg-gradient-to-b ${exp.color} p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl" role="img" aria-label={exp.title}>
                  {exp.icon}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                  {exp.badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-zinc-900">{exp.title}</h3>
                <p className="text-[11px] font-semibold text-zinc-600 mt-0.5">{exp.subtitle}</p>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{exp.description}</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={exp.downloadUrl}
                download={exp.filename}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer ${exp.buttonColor}`}
              >
                <span>📥</span>
                <span>Download {exp.title.split(' ')[0]} CSV</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
