'use client';

import React from 'react';
import { WeddingEventDTO } from '@/modules/event/event.service';
import { StandardEventType } from '@/shared/constants';

interface CeremonyCardProps {
  event: WeddingEventDTO;
  onEdit: (event: WeddingEventDTO) => void;
  onArchive: (eventId: string) => void;
  isArchiving?: boolean;
}

export const CEREMONY_TYPE_CONFIG: Record<
  StandardEventType,
  { label: string; icon: string; bgClass: string; textClass: string; borderClass: string }
> = {
  HALDI: {
    label: 'Haldi',
    icon: '🟡',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  },
  MEHENDI: {
    label: 'Mehendi',
    icon: '🌿',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
  },
  SANGEET: {
    label: 'Sangeet',
    icon: '🎵',
    bgClass: 'bg-purple-50',
    textClass: 'text-purple-800',
    borderClass: 'border-purple-200',
  },
  WEDDING: {
    label: 'Wedding & Pheras',
    icon: '🌺',
    bgClass: 'bg-rose-50',
    textClass: 'text-brand-crimson',
    borderClass: 'border-rose-200',
  },
  RECEPTION: {
    label: 'Reception',
    icon: '🥂',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
  },
  ENGAGEMENT: {
    label: 'Engagement',
    icon: '💍',
    bgClass: 'bg-pink-50',
    textClass: 'text-pink-800',
    borderClass: 'border-pink-200',
  },
  ROKA: {
    label: 'Roka',
    icon: '🪔',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
  },
  COCKTAIL: {
    label: 'Cocktail',
    icon: '🍸',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-200',
  },
  CUSTOM: {
    label: 'Celebration',
    icon: '✨',
    bgClass: 'bg-zinc-50',
    textClass: 'text-zinc-800',
    borderClass: 'border-zinc-200',
  },
};

export function CeremonyCard({ event, onEdit, onArchive, isArchiving }: CeremonyCardProps) {
  const config = CEREMONY_TYPE_CONFIG[event.type] || CEREMONY_TYPE_CONFIG.CUSTOM;

  // Format date and time
  const startDate = new Date(event.startsAt);
  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const startTime = startDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = event.endsAt
    ? new Date(event.endsAt).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : null;

  const mapsQuery = event.address || event.venueName;

  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-4">
      {/* Header: Type Badge & Action Buttons */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold ${config.bgClass} ${config.textClass} ${config.borderClass}`}
          >
            <span>{config.icon}</span>
            <span>{event.name}</span>
          </span>
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(event)}
            className="rounded-xl border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => onArchive(event.id)}
            disabled={isArchiving}
            className="rounded-xl border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Date & Time Highlights */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-700 font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">📅</span>
          <span className="font-semibold text-zinc-900">{formattedDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">⏰</span>
          <span>
            {startTime} {endTime ? `– ${endTime}` : ''}
          </span>
        </div>
      </div>

      {/* Venue & Maps */}
      {(event.venueName || event.address) && (
        <div className="flex items-start justify-between gap-3 text-xs bg-zinc-50/80 rounded-2xl p-3 border border-zinc-100">
          <div className="space-y-0.5 min-w-0">
            {event.venueName && (
              <p className="font-semibold text-zinc-900 truncate">{event.venueName}</p>
            )}
            {event.address && (
              <p className="text-zinc-500 line-clamp-1">{event.address}</p>
            )}
          </div>
          {mapsQuery && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-crimson hover:underline"
            >
              <span>Map</span>
              <span>↗</span>
            </a>
          )}
        </div>
      )}

      {/* Dress Code & Description */}
      {(event.dressCode || event.description) && (
        <div className="space-y-2 pt-1 border-t border-zinc-100 text-xs">
          {event.dressCode && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
                Dress Code:
              </span>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-900 font-medium">
                👗 {event.dressCode}
              </span>
            </div>
          )}
          {event.description && (
            <p className="text-zinc-600 leading-relaxed text-xs">{event.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
