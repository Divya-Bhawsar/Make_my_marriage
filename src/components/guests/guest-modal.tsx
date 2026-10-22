'use client';

import React, { useState, useEffect } from 'react';
import { GuestDTO } from '@/modules/guest/guest.service';
import { WeddingEventDTO } from '@/modules/event/event.service';
import {
  GUEST_SIDE,
  GuestSide,
  DIETARY_PREFERENCE,
  DietaryPreference,
  RSVP_STATUS,
  RsvpStatus,
} from '@/shared/constants';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  guestToEdit?: GuestDTO | null;
  events: WeddingEventDTO[];
  groomName?: string;
  brideName?: string;
}

export function GuestModal({
  isOpen,
  onClose,
  onSave,
  guestToEdit,
  events,
  groomName = 'Groom',
  brideName = 'Bride',
}: GuestModalProps) {
  const [name, setName] = useState(guestToEdit?.name || '');
  const [email, setEmail] = useState(guestToEdit?.email || '');
  const [phone, setPhone] = useState(guestToEdit?.phone || '');
  const [side, setSide] = useState<GuestSide>(guestToEdit?.side || GUEST_SIDE.GROOM);
  const [dietary, setDietary] = useState<DietaryPreference>(guestToEdit?.dietary || DIETARY_PREFERENCE.ALL);
  const [maxGuests, setMaxGuests] = useState(guestToEdit?.maxGuests || 2);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>(
    guestToEdit ? guestToEdit.invitedEventIds || [] : events.map((e) => e.id)
  );
  const [notes, setNotes] = useState(guestToEdit?.notes || '');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(guestToEdit?.rsvpStatus || RSVP_STATUS.PENDING);
  const [attendingCount, setAttendingCount] = useState<number>(
    guestToEdit?.attendingCount ?? guestToEdit?.maxGuests ?? 1
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guestToEdit) {
      setName(guestToEdit.name);
      setEmail(guestToEdit.email || '');
      setPhone(guestToEdit.phone || '');
      setSide(guestToEdit.side);
      setDietary(guestToEdit.dietary);
      setMaxGuests(guestToEdit.maxGuests);
      setSelectedEventIds(guestToEdit.invitedEventIds || []);
      setNotes(guestToEdit.notes || '');
      setRsvpStatus(guestToEdit.rsvpStatus || RSVP_STATUS.PENDING);
      setAttendingCount(guestToEdit.attendingCount ?? guestToEdit.maxGuests);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setSide(GUEST_SIDE.GROOM);
      setDietary(DIETARY_PREFERENCE.ALL);
      setMaxGuests(2);
      // By default invite to all available events
      setSelectedEventIds(events.map((e) => e.id));
      setNotes('');
      setRsvpStatus(RSVP_STATUS.PENDING);
      setAttendingCount(2);
    }
    setFieldErrors({});
    setSubmitError('');
  }, [guestToEdit, events, isOpen]);

  if (!isOpen) return null;

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleSelectAllEvents = () => {
    setSelectedEventIds(events.map((e) => e.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Guest or family name is required';
    if (maxGuests < 1) errors.maxGuests = 'Capacity must be at least 1';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        side,
        dietary,
        maxGuests,
        invitedEventIds: selectedEventIds,
        notes: notes.trim() || null,
        ...(guestToEdit
          ? {
              rsvpStatus,
              attendingCount: rsvpStatus === RSVP_STATUS.ATTENDING ? attendingCount : 0,
            }
          : {}),
      };

      const url = guestToEdit ? `/api/guests/${guestToEdit.id}` : '/api/guests';
      const method = guestToEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to save guest');
      }

      onSave();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl border border-brand-sand/80 bg-white p-6 sm:p-8 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-serif font-bold text-zinc-900">
              {guestToEdit ? 'Edit Guest' : 'Add Guest / Family'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Set side, party headcount, dietary preference, and ceremonies
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Global Error */}
        {submitError && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium"
          >
            ⚠️ {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Guest Name & Side */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="guestName"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Guest / Family Name <span className="text-brand-crimson">*</span>
              </label>
              <input
                id="guestName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Rajesh Sharma & Family"
                className={`w-full rounded-xl border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-hidden ${
                  fieldErrors.name
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-zinc-300 focus:border-brand-crimson focus:ring-2 focus:ring-brand-crimson/15'
                }`}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="side"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Wedding Side
              </label>
              <select
                id="side"
                value={side}
                onChange={(e) => setSide(e.target.value as GuestSide)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
              >
                <option value={GUEST_SIDE.GROOM}>{`${groomName}'s Side`}</option>
                <option value={GUEST_SIDE.BRIDE}>{`${brideName}'s Side`}</option>
                <option value={GUEST_SIDE.MUTUAL}>Mutual / Both</option>
              </select>
            </div>
          </div>

          {/* Max Party Size & Dietary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="maxGuests"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Max Party Size (Plates) <span className="text-brand-crimson">*</span>
              </label>
              <input
                id="maxGuests"
                type="number"
                min={1}
                max={100}
                value={maxGuests}
                onChange={(e) => setMaxGuests(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
              />
              <p className="text-[10px] text-zinc-400 mt-0.5">Total adults + children</p>
            </div>

            <div>
              <label
                htmlFor="dietary"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Dietary Requirement
              </label>
              <select
                id="dietary"
                value={dietary}
                onChange={(e) => setDietary(e.target.value as DietaryPreference)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
              >
                <option value={DIETARY_PREFERENCE.ALL}>No Preference (All)</option>
                <option value={DIETARY_PREFERENCE.PURE_VEG}>Pure Vegetarian</option>
                <option value={DIETARY_PREFERENCE.JAIN}>Jain (No Root Veg)</option>
                <option value={DIETARY_PREFERENCE.NON_VEG}>Non-Vegetarian</option>
              </select>
            </div>
          </div>

          {/* Contact (Phone for WhatsApp, Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Phone (for WhatsApp)
              </label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@example.com"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>
          </div>

          {/* Invited Ceremonies Multi-Select */}
          {events.length > 0 && (
            <div className="pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                  Invited Ceremonies
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllEvents}
                  className="text-[11px] font-semibold text-brand-crimson hover:underline cursor-pointer"
                >
                  Select All
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {events.map((ev) => {
                  const isChecked = selectedEventIds.includes(ev.id);
                  return (
                    <label
                      key={ev.id}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-brand-crimson/40 bg-brand-crimson/5 text-zinc-900 font-medium'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEvent(ev.id)}
                          className="h-4 w-4 rounded-sm border-zinc-300 text-brand-crimson focus:ring-brand-crimson cursor-pointer"
                        />
                        <span>{ev.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {new Date(ev.startsAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* RSVP Status (Only when editing existing guest) */}
          {guestToEdit && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                  RSVP & Attendance Status
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  Host direct update
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modalRsvpStatus" className="block text-[11px] font-semibold text-zinc-600 mb-1">
                    RSVP Response
                  </label>
                  <select
                    id="modalRsvpStatus"
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
                  >
                    <option value={RSVP_STATUS.PENDING}>⏳ Pending Response</option>
                    <option value={RSVP_STATUS.ATTENDING}>🟢 Joyfully Attending</option>
                    <option value={RSVP_STATUS.NOT_ATTENDING}>🔴 Regretfully Declined</option>
                  </select>
                </div>

                {rsvpStatus === RSVP_STATUS.ATTENDING && (
                  <div>
                    <label htmlFor="modalAttendingCount" className="block text-[11px] font-semibold text-zinc-600 mb-1">
                      Confirmed Attending Plates (max {maxGuests})
                    </label>
                    <input
                      id="modalAttendingCount"
                      type="number"
                      min={1}
                      max={maxGuests}
                      value={attendingCount}
                      onChange={(e) => setAttendingCount(Math.min(maxGuests, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
            >
              Notes (Private)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Needs ground floor room, college friend, staying at hotel"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{guestToEdit ? 'Save Changes' : 'Add Guest 💌'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
