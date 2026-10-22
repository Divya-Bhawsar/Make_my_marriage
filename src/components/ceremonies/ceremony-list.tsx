'use client';

import React, { useState, useEffect } from 'react';
import { WeddingEventDTO } from '@/modules/event/event.service';
import { CeremonyCard } from './ceremony-card';
import { CeremonyModal } from './ceremony-modal';

interface CeremonyListProps {
  weddingDate?: string;
}

export function CeremonyList({ weddingDate }: CeremonyListProps) {
  const [events, setEvents] = useState<WeddingEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WeddingEventDTO | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to load ceremonies');
      const json = await res.json();
      setEvents(json.data || []);
      setError('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading ceremonies';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEdit = (event: WeddingEventDTO) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleArchive = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to archive this ceremony?')) {
      return;
    }

    try {
      setArchivingId(eventId);
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to archive ceremony');
      await fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error archiving ceremony';
      alert(msg);
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-serif font-bold text-zinc-900">
              Ceremonies & Itinerary
            </h1>
            <span className="rounded-full bg-brand-crimson/10 px-2.5 py-0.5 text-xs font-semibold text-brand-crimson">
              {events.length} {events.length === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Organize your Haldi, Mehendi, Sangeet, Pheras, and Reception timelines.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-crimson to-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>➕</span>
          <span>Add Ceremony</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="text-center py-12 space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-brand-crimson border-t-transparent" />
          <p className="text-xs text-zinc-500 font-medium">Loading ceremonies...</p>
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-zinc-200 bg-white p-10 text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
            🪔
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-zinc-900">
              No ceremonies scheduled yet
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
              Start building your multi-day celebration schedule. Add timings, venues, dress codes, and ceremonial rituals.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-crimson px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-105 cursor-pointer"
            >
              <span>➕ Schedule Your First Ceremony</span>
            </button>
          </div>
        </div>
      ) : (
        /* Ceremonies Timeline Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((event) => (
            <CeremonyCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onArchive={handleArchive}
              isArchiving={archivingId === event.id}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <CeremonyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchEvents}
        eventToEdit={eventToEdit}
        defaultDate={weddingDate}
      />
    </div>
  );
}
