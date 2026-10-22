'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  IVendorResponse,
  IVendorSummaryMetrics,
} from '@/modules/vendor/vendor.service';
import { VendorMetricStrip, VENDOR_CATEGORY_META } from './vendor-metric-strip';
import { VendorCard } from './vendor-card';
import { VendorModal } from './vendor-modal';
import { VendorDiscovery } from './vendor-discovery';
import { VENDOR_CATEGORIES, VendorCategory } from '@/shared/constants';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

export function VendorNotebook() {
  const [activeTab, setActiveTab] = useState<'booked' | 'discover'>('booked');
  const [vendors, setVendors] = useState<IVendorResponse[]>([]);
  const [metrics, setMetrics] = useState<IVendorSummaryMetrics | null>(null);
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Booked Vendors
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<IVendorResponse | null>(null);

  // Delete confirmation
  const [vendorToDelete, setVendorToDelete] = useState<IVendorResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch summary metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors/summary');
      const json = await res.json();
      if (res.ok && json.data) {
        setMetrics(json.data);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // Fetch booked vendors list
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (categoryFilter && categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (showArchived) params.set('includeArchived', 'true');

      const res = await fetch(`/api/vendors?${params.toString()}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setVendors(json.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, showArchived]);

  // Fetch ceremonies for event assignment
  const fetchCeremonies = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      const json = await res.json();
      if (res.ok && json.data) {
        setCeremonies(
          json.data.map((e: { id: string; name: string; type: string }) => ({
            id: e.id,
            name: e.name,
            type: e.type,
          }))
        );
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchCeremonies();
  }, [fetchMetrics, fetchCeremonies]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleOpenAddModal = () => {
    setVendorToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vendor: IVendorResponse) => {
    setVendorToEdit(vendor);
    setIsModalOpen(true);
  };

  const handleArchiveToggle = async (vendor: IVendorResponse) => {
    const isCurrentlyArchived = Boolean(vendor.archivedAt);
    try {
      if (isCurrentlyArchived) {
        // Restore
        await fetch(`/api/vendors/${vendor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archivedAt: null }),
        });
      } else {
        // Archive
        await fetch(`/api/vendors/${vendor.id}`, {
          method: 'DELETE',
        });
      }
      fetchVendors();
      fetchMetrics();
    } catch {
      // Graceful error
    }
  };

  const handleDeletePermanent = (vendor: IVendorResponse) => {
    setDeleteError(null);
    setVendorToDelete(vendor);
  };

  const confirmDeletePermanent = async () => {
    if (!vendorToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/vendors/${vendorToDelete.id}?permanent=true`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to delete vendor');
      }

      setVendorToDelete(null);
      fetchVendors();
      fetchMetrics();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error deleting vendor');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
            Vendor Notebook & Local Discovery
          </h2>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Maintain booked wedding vendors, contract amounts, contact cards, and explore top-rated local services.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-brand-crimson text-white text-xs font-bold rounded-xl hover:bg-brand-crimson/90 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Booked Vendor</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Strip */}
      <VendorMetricStrip metrics={metrics} />

      {/* Navigation Tabs */}
      <div className="border-b border-brand-sand flex items-center gap-4">
        <button
          onClick={() => setActiveTab('booked')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'booked'
              ? 'border-brand-crimson text-brand-crimson'
              : 'border-transparent text-brand-charcoal/60 hover:text-brand-charcoal'
          }`}
        >
          <span>🤝</span>
          <span>My Booked Vendors</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-sand/40 text-brand-charcoal">
            {vendors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'discover'
              ? 'border-brand-crimson text-brand-crimson'
              : 'border-transparent text-brand-charcoal/60 hover:text-brand-charcoal'
          }`}
        >
          <span>🔍</span>
          <span>Discover Nearby Vendors</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-gold/20 text-brand-gold font-semibold">
            Google Places
          </span>
        </button>
      </div>

      {/* Tab 1: My Booked Vendors */}
      {activeTab === 'booked' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-brand-sand rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3.5 top-2.5 text-brand-charcoal/40 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search vendor name, contact person, or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-brand-sand/10 focus:outline-hidden focus:border-brand-gold"
              />
            </div>

            {/* Category Select & Archived Toggle */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold font-medium"
              >
                <option value="ALL">All Categories</option>
                {VENDOR_CATEGORIES.map((cat) => {
                  const meta = VENDOR_CATEGORY_META[cat];
                  return (
                    <option key={cat} value={cat}>
                      {meta ? `${meta.icon} ${meta.label}` : cat}
                    </option>
                  );
                })}
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer select-none text-brand-charcoal/70 font-medium px-2 py-1">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded-sm border-brand-sand text-brand-crimson focus:ring-brand-gold"
                />
                <span>Include Archived</span>
              </label>
            </div>
          </div>

          {/* Vendors Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-56 bg-brand-sand/40 rounded-2xl" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-brand-sand p-8 shadow-2xs">
              <span className="text-4xl block mb-2">🤝</span>
              <h3 className="text-lg font-bold font-serif text-brand-charcoal">
                No booked vendors recorded yet
              </h3>
              <p className="text-xs text-brand-charcoal/60 mt-1 max-w-md mx-auto">
                Add hired photographers, caterers, decorators, or DJs to keep contacts, contract costs,
                and ceremony assignments organized.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-brand-crimson text-white text-xs font-bold rounded-xl hover:bg-brand-crimson/90 transition-all shadow-xs"
                >
                  + Add Booked Vendor
                </button>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-4 py-2 bg-brand-sand/50 text-brand-charcoal text-xs font-semibold rounded-xl hover:bg-brand-sand transition-all"
                >
                  🔍 Discover Nearby Vendors
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onEdit={handleEdit}
                  onArchiveToggle={handleArchiveToggle}
                  onDeletePermanent={handleDeletePermanent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Discover Nearby Vendors */}
      {activeTab === 'discover' && (
        <VendorDiscovery
          onVendorAdded={() => {
            fetchVendors();
            fetchMetrics();
          }}
        />
      )}

      {/* Add / Edit Modal */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchVendors();
          fetchMetrics();
        }}
        vendorToEdit={vendorToEdit}
        ceremonies={ceremonies}
      />

      {/* Permanent Delete Confirmation Dialog */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-brand-sand space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold font-serif text-brand-charcoal">
                Permanently Delete Vendor?
              </h3>
            </div>

            <p className="text-xs text-brand-charcoal/70">
              Are you sure you want to permanently remove{' '}
              <strong className="text-brand-charcoal">&quot;{vendorToDelete.name}&quot;</strong>? This
              action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setVendorToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-brand-charcoal hover:bg-brand-sand/40 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePermanent}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleting && <span className="animate-spin text-[10px]">⏳</span>}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
