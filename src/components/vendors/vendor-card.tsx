'use client';

import React from 'react';
import { IVendorResponse } from '@/modules/vendor/vendor.service';
import { formatRupees, formatCompactRupees } from '@/shared/utils/currency';
import { VENDOR_CATEGORY_META } from './vendor-metric-strip';

interface VendorCardProps {
  vendor: IVendorResponse;
  onEdit: (vendor: IVendorResponse) => void;
  onArchiveToggle: (vendor: IVendorResponse) => void;
  onDeletePermanent: (vendor: IVendorResponse) => void;
}

export function VendorCard({
  vendor,
  onEdit,
  onArchiveToggle,
  onDeletePermanent,
}: VendorCardProps) {
  const meta = VENDOR_CATEGORY_META[vendor.category] || {
    label: vendor.category,
    icon: '✨',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
  };

  const isArchived = Boolean(vendor.archivedAt);
  const totalAgreed = vendor.totalAgreedCostPaise || 0;
  const totalPaid = vendor.totalPaidPaise || 0;
  const paymentPercent =
    totalAgreed > 0 ? Math.min(100, Math.round((totalPaid / totalAgreed) * 100)) : 0;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
        isArchived ? 'border-dashed border-gray-300 opacity-75 bg-gray-50/50' : 'border-brand-sand'
      }`}
    >
      <div>
        {/* Top Header: Category Pill & Source */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {vendor.source === 'GOOGLE_PLACES' && (
              <span
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 flex items-center gap-1"
                title="Verified via Google Places"
              >
                <span>🌐</span>
                <span>Google Verified</span>
              </span>
            )}

            {isArchived && (
              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-semibold rounded-full">
                Archived
              </span>
            )}
          </div>
        </div>

        {/* Vendor Name & Google Rating */}
        <div className="mb-2">
          <h4 className="text-lg font-bold font-serif text-brand-charcoal hover:text-brand-crimson transition-colors line-clamp-1">
            {vendor.name}
          </h4>
          {vendor.rating && (
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-brand-charcoal/70">
              <span className="text-amber-500 font-bold">★ {vendor.rating.toFixed(1)}</span>
              {vendor.userRatingsTotal && (
                <span className="text-brand-charcoal/50">({vendor.userRatingsTotal} Google reviews)</span>
              )}
            </div>
          )}
        </div>

        {/* Contact Person & Quick Links */}
        <div className="space-y-1.5 text-xs text-brand-charcoal/80 mb-3.5">
          {vendor.contactPerson && (
            <div className="flex items-center gap-2">
              <span className="text-brand-charcoal/50">👤</span>
              <span className="font-medium">{vendor.contactPerson}</span>
            </div>
          )}

          {vendor.phone && (
            <div className="flex items-center gap-2">
              <span className="text-brand-charcoal/50">📞</span>
              <a
                href={`tel:${vendor.phone}`}
                className="hover:text-brand-crimson hover:underline font-mono"
              >
                {vendor.phone}
              </a>
            </div>
          )}

          {vendor.email && (
            <div className="flex items-center gap-2">
              <span className="text-brand-charcoal/50">✉️</span>
              <a
                href={`mailto:${vendor.email}`}
                className="hover:text-brand-crimson hover:underline truncate max-w-[220px]"
              >
                {vendor.email}
              </a>
            </div>
          )}

          {vendor.address && (
            <div className="flex items-start gap-2">
              <span className="text-brand-charcoal/50 mt-0.5">📍</span>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${vendor.name} ${vendor.address}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-crimson hover:underline line-clamp-1"
                title={vendor.address}
              >
                {vendor.address}
              </a>
            </div>
          )}

          {vendor.website && (
            <div className="flex items-center gap-2">
              <span className="text-brand-charcoal/50">🔗</span>
              <a
                href={
                  vendor.website.startsWith('http')
                    ? vendor.website
                    : `https://${vendor.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-brand-crimson hover:underline truncate max-w-[220px]"
              >
                {vendor.website.replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </div>
          )}
        </div>

        {/* Financial Contract & Paid Progress */}
        <div className="bg-brand-sand/15 border border-brand-sand/60 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-brand-charcoal/70 font-medium">Agreed Contract</span>
            <span className="font-bold text-brand-charcoal font-serif">
              {vendor.totalAgreedCostPaise !== null
                ? formatRupees(vendor.totalAgreedCostPaise)
                : 'Not specified'}
            </span>
          </div>

          {vendor.totalAgreedCostPaise !== null && vendor.totalAgreedCostPaise > 0 && (
            <div>
              <div className="w-full bg-brand-sand/40 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className="bg-brand-emerald h-full rounded-full transition-all duration-500"
                  style={{ width: `${paymentPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-brand-charcoal/60">
                <span>Paid: {formatCompactRupees(totalPaid)}</span>
                <span>
                  Due:{' '}
                  {formatCompactRupees(Math.max(0, totalAgreed - totalPaid))} ({paymentPercent}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Linked Ceremonies */}
        {vendor.events && vendor.events.length > 0 && (
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-brand-charcoal/60 block mb-1">
              Contracted Ceremonies ({vendor.events.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {vendor.events.map((evt) => (
                <span
                  key={evt.id}
                  className="px-2 py-0.5 bg-brand-sand/30 border border-brand-sand rounded-md text-[11px] text-brand-charcoal font-medium"
                >
                  {evt.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contract Notes */}
        {vendor.notes && (
          <div className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl text-xs text-brand-charcoal/80 mb-3 italic">
            &quot;{vendor.notes}&quot;
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 border-t border-brand-sand flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(vendor)}
            className="px-2.5 py-1 text-brand-charcoal hover:text-brand-crimson hover:bg-brand-sand/40 rounded-lg transition-colors font-medium flex items-center gap-1"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>

          {vendor.phone && (
            <a
              href={`tel:${vendor.phone}`}
              className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              <span>📞</span>
              <span>Call</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onArchiveToggle(vendor)}
            className="px-2.5 py-1 text-brand-charcoal/60 hover:text-brand-charcoal hover:bg-brand-sand/40 rounded-lg transition-colors font-medium"
            title={isArchived ? 'Restore to active vendors' : 'Archive vendor'}
          >
            {isArchived ? '↩️ Restore' : '📦 Archive'}
          </button>

          <button
            onClick={() => onDeletePermanent(vendor)}
            className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
            title="Delete vendor"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
