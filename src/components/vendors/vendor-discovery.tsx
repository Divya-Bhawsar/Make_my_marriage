'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IDiscoveredVendor } from '@/modules/vendor/vendor.service';
import { VENDOR_CATEGORIES, VendorCategory } from '@/shared/constants';
import { VENDOR_CATEGORY_META } from './vendor-metric-strip';

interface VendorDiscoveryProps {
  onVendorAdded: () => void;
}

export function VendorDiscovery({ onVendorAdded }: VendorDiscoveryProps) {
  const [vendors, setVendors] = useState<IDiscoveredVendor[]>([]);
  const [city, setCity] = useState<string>('Indore');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [addingPlaceId, setAddingPlaceId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchDiscoveredVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter && categoryFilter !== 'ALL') {
        params.set('category', categoryFilter);
      }
      if (searchQuery.trim()) {
        params.set('query', searchQuery.trim());
      }

      const res = await fetch(`/api/vendor-discovery/search?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setVendors(json.data);
        if (json.city) setCity(json.city);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    fetchDiscoveredVendors();
  }, [fetchDiscoveredVendors]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDiscoveredVendors();
  };

  const handleAddFromPlace = async (vendor: IDiscoveredVendor) => {
    setAddingPlaceId(vendor.googlePlaceId);
    setFeedbackMessage(null);

    try {
      const res = await fetch('/api/vendors/from-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlaceId: vendor.googlePlaceId,
          name: vendor.name,
          category: vendor.category,
          phone: vendor.phone,
          address: vendor.address,
          website: vendor.website,
          rating: vendor.rating,
          userRatingsTotal: vendor.userRatingsTotal,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add vendor to notebook');
      }

      // Mark locally as added
      setVendors((prev) =>
        prev.map((v) =>
          v.googlePlaceId === vendor.googlePlaceId
            ? { ...v, isAdded: true, addedVendorId: json.data?.id || 'added' }
            : v
        )
      );

      setFeedbackMessage(`✓ "${vendor.name}" added to your booked wedding notebook!`);
      onVendorAdded();

      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: unknown) {
      setFeedbackMessage(`⚠️ ${err instanceof Error ? err.message : 'Error adding vendor'}`);
    } finally {
      setAddingPlaceId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* City Banner & Discovery Header */}
      <div className="bg-linear-to-r from-brand-sand/40 via-brand-gold/10 to-brand-sand/40 border border-brand-sand rounded-2xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-bold uppercase tracking-wider mb-1.5">
              <span>📍</span>
              <span>Nearby Wedding Marketplace</span>
            </div>
            <h3 className="text-xl font-bold font-serif text-brand-charcoal">
              Discover Wedding Vendors near <span className="text-brand-crimson">{city}</span>
            </h3>
            <p className="text-xs text-brand-charcoal/70 mt-1 max-w-2xl">
              Curated top-rated wedding venues, halwais, photographers, makeup artists, and decorators
              in your wedding destination. Click &quot;Add to My Vendors&quot; to bring them into your notebook.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search vendor name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3.5 py-2 text-sm border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold w-64 shadow-2xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-brand-crimson text-white text-sm font-semibold rounded-xl hover:bg-brand-crimson/90 transition-colors shadow-xs"
            >
              Search
            </button>
          </form>
        </div>

        {/* Feedback alert banner */}
        {feedbackMessage && (
          <div className="mt-4 p-3 bg-white/90 border border-brand-gold/40 text-brand-charcoal text-xs font-medium rounded-xl shadow-xs animate-in fade-in">
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Category Pills Strip */}
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('ALL')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            categoryFilter === 'ALL'
              ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-xs'
              : 'bg-white text-brand-charcoal border-brand-sand hover:border-brand-gold'
          }`}
        >
          All Categories
        </button>

        {VENDOR_CATEGORIES.map((catKey) => {
          const meta = VENDOR_CATEGORY_META[catKey];
          const isSelected = categoryFilter === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setCategoryFilter(catKey)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-brand-crimson text-white border-brand-crimson shadow-xs'
                  : 'bg-white text-brand-charcoal border-brand-sand hover:border-brand-gold'
              }`}
            >
              <span>{meta?.icon || '✨'}</span>
              <span>{meta?.label || catKey}</span>
            </button>
          );
        })}
      </div>

      {/* Discovered Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-brand-sand/40 rounded-2xl" />
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-brand-sand p-6">
          <span className="text-4xl block mb-2">🔍</span>
          <h4 className="text-base font-bold text-brand-charcoal font-serif">
            No vendors found matching your filter
          </h4>
          <p className="text-xs text-brand-charcoal/60 mt-1">
            Try switching category or clearing your search term.
          </p>
          <button
            onClick={() => {
              setCategoryFilter('ALL');
              setSearchQuery('');
            }}
            className="mt-3 px-4 py-1.5 text-xs font-semibold bg-brand-sand/50 text-brand-charcoal rounded-xl hover:bg-brand-sand transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => {
            const meta = VENDOR_CATEGORY_META[vendor.category] || {
              label: vendor.category,
              icon: '✨',
              bg: 'bg-gray-50',
              text: 'text-gray-700',
              border: 'border-gray-200',
            };

            const isAdding = addingPlaceId === vendor.googlePlaceId;

            return (
              <div
                key={vendor.googlePlaceId}
                className="bg-white border border-brand-sand rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category Pill & Rating */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg} ${meta.text} ${meta.border}`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.label}</span>
                    </span>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <span>★</span>
                      <span>{vendor.rating.toFixed(1)}</span>
                      <span className="text-brand-charcoal/50 font-normal">
                        ({vendor.userRatingsTotal})
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <h4 className="text-base font-bold font-serif text-brand-charcoal line-clamp-1 mb-2">
                    {vendor.name}
                  </h4>

                  {/* Address & Phone */}
                  <div className="space-y-1.5 text-xs text-brand-charcoal/80 mb-4">
                    <div className="flex items-start gap-1.5">
                      <span className="text-brand-charcoal/50 mt-0.5">📍</span>
                      <span className="line-clamp-2" title={vendor.address}>
                        {vendor.address}
                      </span>
                    </div>

                    {vendor.phone && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-brand-charcoal/50">📞</span>
                        <a
                          href={`tel:${vendor.phone}`}
                          className="hover:text-brand-crimson font-mono"
                        >
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to Notebook Button */}
                <div className="pt-3 border-t border-brand-sand flex items-center justify-between gap-2">
                  {vendor.website ? (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-charcoal/60 hover:text-brand-crimson underline truncate max-w-[130px]"
                    >
                      View Website ↗
                    </a>
                  ) : (
                    <span className="text-xs text-brand-charcoal/40 italic">Google Verified</span>
                  )}

                  {vendor.isAdded ? (
                    <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-1">
                      <span>✓</span>
                      <span>In Notebook</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAddFromPlace(vendor)}
                      disabled={isAdding}
                      className="px-3.5 py-1.5 bg-brand-crimson text-white text-xs font-bold rounded-xl hover:bg-brand-crimson/90 transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isAdding && <span className="animate-spin text-[10px]">⏳</span>}
                      <span>+ Add to My Vendors</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
