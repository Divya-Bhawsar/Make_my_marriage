'use client';

import React, { useState, useEffect } from 'react';
import { WeddingEventDTO } from '@/modules/event/event.service';
import { STANDARD_EVENT_TYPES, StandardEventType } from '@/shared/constants';

interface CeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eventToEdit?: WeddingEventDTO | null;
  defaultDate?: string;
}

const PRESETS = [
  { label: '🟡 Haldi', type: 'HALDI' as StandardEventType, name: 'Haldi Ceremony', dressCode: 'Shades of Yellow' },
  { label: '🌿 Mehendi', type: 'MEHENDI' as StandardEventType, name: 'Mehendi & Dholki', dressCode: 'Floral Greenery' },
  { label: '🎵 Sangeet', type: 'SANGEET' as StandardEventType, name: 'Sangeet & DJ Night', dressCode: 'Glamour & Indo-Western' },
  { label: '🌺 Wedding & Pheras', type: 'WEDDING' as StandardEventType, name: 'Varmala & Pheras', dressCode: 'Royal Traditional' },
  { label: '🥂 Reception', type: 'RECEPTION' as StandardEventType, name: 'Grand Reception Dinner', dressCode: 'Formal Indian / Black Tie' },
];

export function CeremonyModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  defaultDate,
}: CeremonyModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<StandardEventType>('CUSTOM');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [dressCode, setDressCode] = useState('');
  const [description, setDescription] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setName(eventToEdit.name);
      setType(eventToEdit.type);
      const start = new Date(eventToEdit.startsAt);
      setDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));

      if (eventToEdit.endsAt) {
        const end = new Date(eventToEdit.endsAt);
        setEndTime(end.toTimeString().slice(0, 5));
      } else {
        setEndTime('');
      }

      setVenueName(eventToEdit.venueName || '');
      setAddress(eventToEdit.address || '');
      setDressCode(eventToEdit.dressCode || '');
      setDescription(eventToEdit.description || '');
    } else {
      setName('');
      setType('CUSTOM');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndTime('13:00');
      setVenueName('');
      setAddress('');
      setDressCode('');
      setDescription('');
    }
    setFieldErrors({});
    setSubmitError('');
  }, [eventToEdit, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setName(preset.name);
    setType(preset.type);
    if (!dressCode) setDressCode(preset.dressCode);
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Ceremony name is required';
    if (!date) errors.date = 'Date is required';
    if (!startTime) errors.startTime = 'Start time is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Build ISO datetime strings with +05:30 IST offset
    const startsAtIso = `${date}T${startTime}:00+05:30`;
    const endsAtIso = endTime ? `${date}T${endTime}:00+05:30` : null;

    if (endsAtIso && new Date(endsAtIso) <= new Date(startsAtIso)) {
      setFieldErrors({ endTime: 'End time must be after start time' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        venueName: venueName.trim() || null,
        address: address.trim() || null,
        dressCode: dressCode.trim() || null,
        description: description.trim() || null,
      };

      const url = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
      const method = eventToEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Failed to save ceremony');
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
              {eventToEdit ? 'Edit Ceremony' : 'Add New Ceremony'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Configure event timings, venue, and dress code
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Global Error Banner */}
        {submitError && (
          <div
            role="alert"
            className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium"
          >
            ⚠️ {submitError}
          </div>
        )}

        {/* Quick Presets for New Ceremonies */}
        {!eventToEdit && (
          <div className="mt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold block mb-1.5">
              Quick Ceremony Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.type}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="rounded-lg bg-zinc-100 hover:bg-brand-sand/50 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Ceremony Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="eventName"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Ceremony Name <span className="text-brand-crimson">*</span>
              </label>
              <input
                id="eventName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Haldi Ceremony"
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
                htmlFor="eventType"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Type
              </label>
              <select
                id="eventType"
                value={type}
                onChange={(e) => setType(e.target.value as StandardEventType)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-crimson focus:outline-hidden"
              >
                {STANDARD_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Timings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="eventDate"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Date <span className="text-brand-crimson">*</span>
              </label>
              <input
                id="eventDate"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: '' }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-zinc-900 focus:outline-hidden ${
                  fieldErrors.date
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-zinc-300 focus:border-brand-crimson'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="startTime"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Start Time <span className="text-brand-crimson">*</span>
              </label>
              <input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (fieldErrors.startTime) setFieldErrors((prev) => ({ ...prev, startTime: '' }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-zinc-900 focus:outline-hidden ${
                  fieldErrors.startTime
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-zinc-300 focus:border-brand-crimson'
                }`}
              />
            </div>

            <div>
              <label
                htmlFor="endTime"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                End Time
              </label>
              <input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  if (fieldErrors.endTime) setFieldErrors((prev) => ({ ...prev, endTime: '' }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-sm text-zinc-900 focus:outline-hidden ${
                  fieldErrors.endTime
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-zinc-300 focus:border-brand-crimson'
                }`}
              />
              {fieldErrors.endTime && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.endTime}</p>
              )}
            </div>
          </div>

          {/* Venue & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="venueName"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Venue / Hall Name
              </label>
              <input
                id="venueName"
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. Sayaji Hotel, Grand Ballroom"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
              >
                Address / City
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Vijay Nagar, Indore"
                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
              />
            </div>
          </div>

          {/* Dress Code */}
          <div>
            <label
              htmlFor="dressCode"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
            >
              Dress Code / Color Theme
            </label>
            <input
              id="dressCode"
              type="text"
              value={dressCode}
              onChange={(e) => setDressCode(e.target.value)}
              placeholder="e.g. Yellow & Floral or Indo-Western"
              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1"
            >
              Ceremonial Notes / Description
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Auspicious haldi rituals begin promptly at 10:30 AM followed by festive lunch."
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
                <span>{eventToEdit ? 'Save Changes' : 'Create Ceremony ✨'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
