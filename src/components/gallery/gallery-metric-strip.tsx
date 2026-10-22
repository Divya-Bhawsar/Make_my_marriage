'use client';

import React from 'react';

interface GalleryMetricStripProps {
  totalCount: number;
  guestCount: number;
  memberCount: number;
  totalSizeBytes: number;
  isGuestUploadsEnabled: boolean;
  onOpenQR: () => void;
  onOpenUpload: () => void;
}

export function GalleryMetricStrip({
  totalCount,
  guestCount,
  memberCount,
  totalSizeBytes,
  isGuestUploadsEnabled,
  onOpenQR,
  onOpenUpload,
}: GalleryMetricStripProps) {
  const formattedStorage =
    totalSizeBytes > 1024 * 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : totalSizeBytes > 1024 * 1024
      ? `${(totalSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalSizeBytes / 1024)} KB`;

  const guestPercentage =
    totalCount > 0 ? Math.round((guestCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/90 border border-brand-sand/70 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-brand-charcoal/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Memories</span>
            <span className="text-xl">📸</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-charcoal">
            {totalCount}
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">
            High-res wedding photos collected
          </p>
        </div>

        <div className="bg-white/90 border border-brand-sand/70 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-brand-charcoal/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Guest Uploads</span>
            <span className="text-xl">🤳</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-crimson">
            {guestCount}
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">
            {guestPercentage}% of total photos from attendees
          </p>
        </div>

        <div className="bg-white/90 border border-brand-sand/70 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-brand-charcoal/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Couple &amp; Family</span>
            <span className="text-xl">👨‍👩‍👦</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-brand-gold">
            {memberCount}
          </div>
          <p className="text-[11px] text-brand-charcoal/60 mt-1">
            Official organizer &amp; photographer photos
          </p>
        </div>

        <div className="bg-white/90 border border-brand-sand/70 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-brand-charcoal/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Storage Used</span>
            <span className="text-xl">💾</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-serif text-emerald-800">
            {formattedStorage}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`h-2 w-2 rounded-full ${
                isGuestUploadsEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'
              }`}
            />
            <span className="text-[11px] font-medium text-brand-charcoal/70">
              {isGuestUploadsEnabled ? 'Guest uploads active' : 'Guest uploads paused'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div className="bg-linear-to-r from-amber-50 via-yellow-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="text-3xl sm:text-4xl">🪔</span>
          <div>
            <h4 className="text-sm sm:text-base font-bold font-serif text-brand-charcoal">
              Collect Candid Moments from Every Dinner Table
            </h4>
            <p className="text-xs text-brand-charcoal/70 mt-0.5 max-w-xl">
              Print luxury table standee cards with QR codes. Guests scan with their phone camera and upload candid moments directly without downloading an app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenQR}
            className="px-4 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-2"
          >
            <span>📱</span>
            <span>Table QR Standee</span>
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="px-4 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-xs transition-transform hover:scale-105 flex items-center gap-2"
          >
            <span>➕</span>
            <span>Upload Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
