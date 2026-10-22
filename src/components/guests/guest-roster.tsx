'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GuestDTO } from '@/modules/guest/guest.service';
import { WeddingEventDTO } from '@/modules/event/event.service';
import { CatererPlateBanner, PlateSummaryData } from './caterer-plate-banner';
import { GuestModal } from './guest-modal';
import { GUEST_SIDE, RSVP_STATUS, RsvpStatus } from '@/shared/constants';

interface GuestRosterProps {
  groomName?: string;
  brideName?: string;
  weddingTitle?: string;
  weddingCity?: string;
}

export function GuestRoster({
  groomName = 'Vivek',
  brideName = 'Eisha',
  weddingTitle = 'Vivek & Eisha',
  weddingCity = 'Indore',
}: GuestRosterProps) {
  const [guests, setGuests] = useState<GuestDTO[]>([]);
  const [events, setEvents] = useState<WeddingEventDTO[]>([]);
  const [summary, setSummary] = useState<PlateSummaryData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [sideFilter, setSideFilter] = useState<string>('ALL');
  const [rsvpFilter, setRsvpFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<GuestDTO | null>(null);
  const [copiedGuestId, setCopiedGuestId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingRsvpId, setUpdatingRsvpId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [guestsRes, eventsRes, summaryRes] = await Promise.all([
        fetch('/api/guests?limit=100'),
        fetch('/api/events'),
        fetch('/api/guests/plate-summary'),
      ]);

      if (!guestsRes.ok || !summaryRes.ok) {
        throw new Error('Failed to load guest list data');
      }

      const guestsJson = await guestsRes.json();
      const summaryJson = await summaryRes.json();
      setGuests(guestsJson.data || []);
      setSummary(summaryJson.data || null);

      if (eventsRes.ok) {
        const eventsJson = await eventsRes.json();
        setEvents(eventsJson.data || []);
      }
      setError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading guest roster';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered list
  const filteredGuests = guests.filter((g) => {
    if (sideFilter !== 'ALL' && g.side !== sideFilter) return false;
    if (rsvpFilter !== 'ALL' && g.rsvpStatus !== rsvpFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchPhone = g.phone ? g.phone.toLowerCase().includes(q) : false;
      const matchEmail = g.email ? g.email.toLowerCase().includes(q) : false;
      return matchName || matchPhone || matchEmail;
    }
    return true;
  });

  const handleEdit = (guest: GuestDTO) => {
    setGuestToEdit(guest);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setGuestToEdit(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (guestId: string) => {
    if (!window.confirm('Are you sure you want to remove this guest from the invitation list?')) {
      return;
    }

    try {
      setDeletingId(guestId);
      const res = await fetch(`/api/guests/${guestId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete guest');
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting guest';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const getInviteUrl = (token?: string) => {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
    const origin =
      configuredUrl && !configuredUrl.includes('localhost')
        ? configuredUrl.replace(/\/$/, '')
        : typeof window !== 'undefined'
        ? window.location.origin
        : '';
    return token ? `${origin}/invite/${token}` : origin;
  };

  const handleCopyLink = async (guest: GuestDTO) => {
    try {
      const inviteUrl = getInviteUrl(guest.invitationToken);
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedGuestId(guest.id);
      setTimeout(() => setCopiedGuestId(null), 2500);
    } catch {
      alert('Could not copy link to clipboard');
    }
  };

  const handleWhatsAppShare = (guest: GuestDTO) => {
    try {
      const inviteUrl = getInviteUrl(guest.invitationToken);
      const message = `Namaste ${guest.name}! 🙏\n\nYou are cordially invited to celebrate ${weddingTitle}'s wedding festivities in ${weddingCity}.\n\nPlease view your ceremonies and confirm attendance here:\n${inviteUrl}`;
      const phoneParam = guest.phone ? `phone=${encodeURIComponent(guest.phone.replace(/[^0-9]/g, ''))}&` : '';
      const whatsappUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Could not open WhatsApp');
    }
  };

  const handleQuickRsvpChange = async (guest: GuestDTO, newStatus: RsvpStatus) => {
    try {
      setUpdatingRsvpId(guest.id);
      const payload = {
        rsvpStatus: newStatus,
        attendingCount:
          newStatus === RSVP_STATUS.ATTENDING
            ? (guest.attendingCount || guest.maxGuests)
            : 0,
      };

      const res = await fetch(`/api/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update RSVP status');
      }

      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating RSVP';
      alert(msg);
    } finally {
      setUpdatingRsvpId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Caterer Plate Calculator Banner */}
      <CatererPlateBanner summary={summary} isLoading={isLoading} />

      {/* Main Roster Card */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-5">
        {/* Header with Title & Add Guest Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900">
                Wedding Guest Roster
              </h1>
              <span className="rounded-full bg-brand-crimson/10 px-2.5 py-0.5 text-xs font-semibold text-brand-crimson">
                {filteredGuests.length} {filteredGuests.length === 1 ? 'Family' : 'Families'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Manage family groupings, ceremony access, and 1-click WhatsApp RSVP invitations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/broadcasts"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
            >
              <span>📢</span>
              <span>WhatsApp Broadcasts</span>
            </Link>
            <button
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>➕</span>
              <span>Add Guest / Family</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        {/* Filters Bar: Search + Side Tabs + RSVP Status */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full rounded-xl border border-zinc-300 bg-white pl-8 pr-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Side Filter */}
            <div className="flex items-center rounded-xl bg-zinc-100 p-1 text-xs">
              {[
                { key: 'ALL', label: 'All Sides' },
                { key: GUEST_SIDE.GROOM, label: `${groomName}'s Side` },
                { key: GUEST_SIDE.BRIDE, label: `${brideName}'s Side` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSideFilter(tab.key)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                    sideFilter === tab.key
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* RSVP Filter */}
            <select
              value={rsvpFilter}
              onChange={(e) => setRsvpFilter(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 font-medium focus:border-brand-crimson focus:outline-hidden"
            >
              <option value="ALL">All RSVPs</option>
              <option value={RSVP_STATUS.ATTENDING}>🟢 Attending</option>
              <option value={RSVP_STATUS.PENDING}>⏳ Pending</option>
              <option value={RSVP_STATUS.NOT_ATTENDING}>🔴 Declined</option>
            </select>
          </div>
        </div>

        {/* Guest Roster Table / Cards */}
        {isLoading ? (
          <div className="text-center py-12 space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-crimson border-t-transparent" />
            <p className="text-xs text-zinc-500 font-medium">Loading guest roster...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-10 text-center space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
              💌
            </div>
            <h3 className="text-base font-serif font-bold text-zinc-900">
              {guests.length === 0 ? 'No guests added yet' : 'No matching guests found'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {guests.length === 0
                ? 'Start adding your family and friends. You can assign them to ceremonies and send 1-click WhatsApp RSVP links.'
                : 'Try adjusting your search query or filters above.'}
            </p>
            {guests.length === 0 && (
              <div className="pt-2">
                <button
                  onClick={handleAdd}
                  className="rounded-xl bg-brand-crimson px-4 py-2 text-xs font-semibold text-white shadow-xs hover:brightness-105 cursor-pointer"
                >
                  ➕ Add First Family
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Guest / Family</th>
                  <th className="py-3 px-3">Side</th>
                  <th className="py-3 px-3">RSVP Status</th>
                  <th className="py-3 px-3">Plates / Party</th>
                  <th className="py-3 px-3">Dietary</th>
                  <th className="py-3 px-3">Invited Ceremonies</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredGuests.map((guest) => {
                  return (
                    <tr key={guest.id} className="hover:bg-zinc-50/60 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-zinc-900">{guest.name}</div>
                        {(guest.phone || guest.email) && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            {guest.phone || guest.email}
                          </div>
                        )}
                        {guest.notes && (
                          <div className="text-[10px] text-amber-700 italic mt-0.5 line-clamp-1">
                            📝 {guest.notes}
                          </div>
                        )}
                      </td>

                      {/* Side */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            guest.side === GUEST_SIDE.GROOM
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : guest.side === GUEST_SIDE.BRIDE
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {guest.side === GUEST_SIDE.GROOM
                            ? `${groomName}'s`
                            : guest.side === GUEST_SIDE.BRIDE
                            ? `${brideName}'s`
                            : 'Mutual'}
                        </span>
                      </td>

                      {/* RSVP Status */}
                      <td className="py-3.5 px-3">
                        <select
                          value={guest.rsvpStatus}
                          disabled={updatingRsvpId === guest.id}
                          onChange={(e) => handleQuickRsvpChange(guest, e.target.value as RsvpStatus)}
                          title="Click to update RSVP status"
                          className={`rounded-lg px-2 py-1 text-[11px] font-semibold border cursor-pointer focus:outline-hidden transition-all ${
                            guest.rsvpStatus === RSVP_STATUS.ATTENDING
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70'
                              : guest.rsvpStatus === RSVP_STATUS.NOT_ATTENDING
                              ? 'bg-zinc-100 text-zinc-600 border-zinc-300 hover:bg-zinc-200/70'
                              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70'
                          }`}
                        >
                          <option value={RSVP_STATUS.PENDING}>⏳ Pending</option>
                          <option value={RSVP_STATUS.ATTENDING}>
                            🟢 Attending ({guest.attendingCount ?? guest.maxGuests})
                          </option>
                          <option value={RSVP_STATUS.NOT_ATTENDING}>🔴 Declined</option>
                        </select>
                      </td>

                      {/* Max Guests */}
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-zinc-900">{guest.maxGuests}</span>
                        <span className="text-zinc-400 text-[11px]"> max plates</span>
                      </td>

                      {/* Dietary */}
                      <td className="py-3.5 px-3">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700">
                          {guest.dietary === 'PURE_VEG'
                            ? '🌱 Pure Veg'
                            : guest.dietary === 'JAIN'
                            ? '🟡 Jain'
                            : guest.dietary === 'NON_VEG'
                            ? '🍗 Non-Veg'
                            : 'No Pref'}
                        </span>
                      </td>

                      {/* Invited Events */}
                      <td className="py-3.5 px-3">
                        <span className="text-zinc-600 font-medium">
                          {guest.invitedEventIds.length}{' '}
                          {guest.invitedEventIds.length === 1 ? 'Ceremony' : 'Ceremonies'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Open RSVP Card */}
                          <a
                            href={guest.invitationToken ? `/invite/${guest.invitationToken}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open Guest's Personal RSVP Card"
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-sand bg-brand-ivory/80 hover:bg-brand-sand/40 text-brand-crimson px-2 py-1 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>💌</span>
                            <span>Open RSVP ↗</span>
                          </a>

                          {/* 1-Click WhatsApp Invite */}
                          <button
                            onClick={() => handleWhatsAppShare(guest)}
                            title="Share Invitation via WhatsApp"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <span>💬</span>
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>

                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(guest)}
                            title="Copy Private Invite Link"
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            {copiedGuestId === guest.id ? '✓ Copied!' : '🔗 Copy'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(guest)}
                            title="Edit Guest & RSVP"
                            className="rounded-lg border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(guest.id)}
                            disabled={deletingId === guest.id}
                            title="Remove Guest"
                            className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guest Modal */}
      <GuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchData}
        guestToEdit={guestToEdit}
        events={events}
        groomName={groomName}
        brideName={brideName}
      />
    </div>
  );
}
