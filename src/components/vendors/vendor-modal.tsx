'use client';

import React, { useState } from 'react';
import { IVendorResponse } from '@/modules/vendor/vendor.service';
import { VENDOR_CATEGORIES, VendorCategory } from '@/shared/constants';
import { VENDOR_CATEGORY_META } from './vendor-metric-strip';
import { paiseToRupees } from '@/shared/utils/currency';

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
}

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendorToEdit?: IVendorResponse | null;
  ceremonies: CeremonyOption[];
}

export function VendorModal({
  isOpen,
  onClose,
  onSuccess,
  vendorToEdit,
  ceremonies,
}: VendorModalProps) {
  const isEditing = Boolean(vendorToEdit);

  // Form states pre-initialized with vendorToEdit props for SSR and instant hydration
  const [name, setName] = useState(vendorToEdit?.name || '');
  const [category, setCategory] = useState<VendorCategory>(vendorToEdit?.category || 'OTHER');
  const [contactPerson, setContactPerson] = useState(vendorToEdit?.contactPerson || '');
  const [phone, setPhone] = useState(vendorToEdit?.phone || '');
  const [email, setEmail] = useState(vendorToEdit?.email || '');
  const [address, setAddress] = useState(vendorToEdit?.address || '');
  const [website, setWebsite] = useState(vendorToEdit?.website || '');
  const [agreedCostRupees, setAgreedCostRupees] = useState(
    vendorToEdit?.totalAgreedCostPaise !== null && vendorToEdit?.totalAgreedCostPaise !== undefined
      ? String(paiseToRupees(vendorToEdit.totalAgreedCostPaise))
      : ''
  );
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    vendorToEdit?.eventIds || []
  );
  const [notes, setNotes] = useState(vendorToEdit?.notes || '');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleEventId = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter vendor or company name');
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        category,
        contactPerson: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        website: website.trim() || null,
        totalAgreedCost: agreedCostRupees ? parseFloat(agreedCostRupees) : null,
        eventIds: selectedEventIds,
        notes: notes.trim() || null,
      };

      const url = isEditing ? `/api/vendors/${vendorToEdit?.id}` : '/api/vendors';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to save vendor details');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-brand-sand my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-brand-sand">
          <div>
            <h3 className="text-xl font-bold font-serif text-brand-charcoal">
              {isEditing ? 'Edit Booked Vendor' : 'Add Hired Wedding Vendor'}
            </h3>
            <p className="text-xs text-brand-charcoal/70 mt-0.5">
              Record contracts, agreed amounts, contact details, and linked ceremonies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brand-charcoal/50 hover:text-brand-charcoal p-1.5 rounded-lg hover:bg-brand-sand/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Vendor / Business Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. The Wedding Filmer, Sayaji Caterers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-brand-sand/10"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Service Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VendorCategory)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              >
                {VENDOR_CATEGORIES.map((catKey) => {
                  const meta = VENDOR_CATEGORY_META[catKey];
                  return (
                    <option key={catKey} value={catKey}>
                      {meta ? `${meta.icon} ${meta.label}` : catKey}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Contact Person / Manager
              </label>
              <input
                type="text"
                placeholder="e.g. Rohit Sharma, Master Halwaiji"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Phone Number (WhatsApp / Calling)
              </label>
              <input
                type="tel"
                placeholder="e.g. +91 98260 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              />
            </div>
          </div>

          {/* Email & Website */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. bookings@vendor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Website / Instagram / Portfolio
              </label>
              <input
                type="text"
                placeholder="e.g. https://instagram.com/vendor"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              />
            </div>
          </div>

          {/* Agreed Cost & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Total Agreed Contract (₹ Rupees)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-semibold text-brand-charcoal/60">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 250000"
                  value={agreedCostRupees}
                  onChange={(e) => setAgreedCostRupees(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
                />
              </div>
              <p className="text-[11px] text-brand-charcoal/60 mt-0.5">
                Saved in paise minor units for precision
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                Studio / Office Address
              </label>
              <input
                type="text"
                placeholder="e.g. Vijay Nagar, AB Road, Indore"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white"
              />
            </div>
          </div>

          {/* Linked Ceremonies */}
          <div>
            <label className="block text-xs font-semibold text-brand-charcoal mb-1.5">
              Assigned Wedding Ceremonies
            </label>
            {ceremonies.length === 0 ? (
              <p className="text-xs text-brand-charcoal/60 italic">
                No ceremonies configured yet. You can link them later under Ceremonies.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-brand-sand/15 border border-brand-sand/50 rounded-xl">
                {ceremonies.map((ceremony) => {
                  const isSelected = selectedEventIds.includes(ceremony.id);
                  return (
                    <button
                      key={ceremony.id}
                      type="button"
                      onClick={() => toggleEventId(ceremony.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-brand-crimson text-white border-brand-crimson shadow-xs'
                          : 'bg-white text-brand-charcoal border-brand-sand hover:border-brand-gold'
                      }`}
                    >
                      <span>{isSelected ? '✓ ' : '+ '}</span>
                      <span>{ceremony.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes & Special Terms */}
          <div>
            <label className="block text-xs font-semibold text-brand-charcoal mb-1">
              Notes, Deliverables & Contract Clauses
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 2 Traditional videographers + 1 drone camera. Raw footage within 10 days, final teaser within 30 days. Advance 25% paid."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-brand-sand rounded-xl focus:outline-hidden focus:border-brand-gold bg-white resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-brand-sand flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-brand-charcoal hover:bg-brand-sand/40 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-bold text-white bg-brand-crimson hover:bg-brand-crimson/90 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <span className="animate-spin text-xs">⏳</span>}
            <span>{isEditing ? 'Update Vendor' : 'Add to Notebook'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
