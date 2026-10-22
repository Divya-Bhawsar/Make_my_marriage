'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/landing/logo';
import { RSVP_STATUS } from '@/shared/constants';

interface PublicInviteCardProps {
  token: string;
}

interface InvitationData {
  guest: {
    id: string;
    name: string;
    side: string;
    dietary: string;
    maxGuests: number;
    rsvpStatus: string;
    attendingCount: number | null;
    wishes: string | null;
  };
  wedding: {
    brideName: string;
    groomName: string;
    weddingDate: string;
    title: string;
    city: string | null;
  };
  events: Array<{
    id: string;
    name: string;
    type: string;
    startsAt: string;
    endsAt: string | null;
    venueName: string | null;
    address: string | null;
    dressCode: string | null;
    description: string | null;
  }>;
}

// Auspicious Ganesha Emblem SVG Component
function GaneshaEmblem({ className = 'h-14 w-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`mx-auto filter drop-shadow-sm ${className}`}
      aria-label="Lord Ganesha Inscription"
    >
      <defs>
        <linearGradient id="goldShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      {/* Halo / Aura */}
      <circle cx="60" cy="60" r="54" stroke="url(#goldShimmer)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
      <circle cx="60" cy="60" r="48" stroke="url(#goldShimmer)" strokeWidth="1" opacity="0.9" />

      {/* Stylized Lord Ganesha Silhouette */}
      {/* Crown / Mukut */}
      <path
        d="M60 22L66 32H54L60 22Z"
        fill="url(#goldShimmer)"
      />
      <path
        d="M60 30C52 30 46 36 46 44C46 54 52 58 56 64C58 67 58 72 55 76C53 79 49 80 46 78"
        stroke="url(#goldShimmer)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Ear Left */}
      <path
        d="M48 40C38 40 34 48 36 56C38 64 44 64 48 60"
        stroke="url(#goldShimmer)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Ear Right */}
      <path
        d="M72 40C82 40 86 48 84 56C82 64 76 64 72 60"
        stroke="url(#goldShimmer)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Trunk Sweep */}
      <path
        d="M60 48C66 48 70 54 70 62C70 74 62 82 56 86C52 89 48 89 46 86C44 83 46 80 50 79"
        stroke="url(#goldShimmer)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Modak in Hand */}
      <circle cx="44" cy="74" r="3.5" fill="url(#goldShimmer)" />
      {/* Auspicious Tilak / Trishul on Forehead */}
      <path d="M60 35V43" stroke="url(#goldShimmer)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="60" cy="38" r="1.5" fill="#9f1239" />
    </svg>
  );
}

// Ornate Corner Motif Component
function CornerFlourish({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`absolute w-8 h-8 sm:w-10 sm:h-10 text-amber-500/80 pointer-events-none ${className}`}
    >
      <path
        d="M2 38V12C2 6.477 6.477 2 12 2H38"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 38V16C8 11.582 11.582 8 16 8H38"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
      <circle cx="16" cy="16" r="3" fill="currentColor" />
      <path d="M22 6L26 2L22 6Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 22L2 26L6 22Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

// Google Calendar URL Generator
function createGoogleCalendarUrl(
  event: {
    name: string;
    startsAt: string;
    endsAt: string | null;
    venueName: string | null;
    address: string | null;
    description: string | null;
  },
  coupleNames: string
) {
  const start = new Date(event.startsAt).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = event.endsAt
    ? new Date(event.endsAt).toISOString().replace(/-|:|\.\d\d\d/g, '')
    : new Date(new Date(event.startsAt).getTime() + 3 * 3600000).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const location = [event.venueName, event.address].filter(Boolean).join(', ');
  const title = `${event.name} — ${coupleNames}'s Wedding Celebration`;
  const details = event.description || `Wedding festivities of ${coupleNames}. We look forward to celebrating with you!`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
}

// Ceremony styling details
function getCeremonyTheming(type: string) {
  switch (type) {
    case 'HALDI':
      return {
        badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300',
        cardBg: 'from-amber-50/70 via-white to-amber-50/40 border-amber-200',
        icon: '🪔',
        hindiName: 'हल्दी उत्सव',
        defaultAttire: 'Yellow / Haldi Paridhan',
      };
    case 'MEHENDI':
      return {
        badgeBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
        cardBg: 'from-emerald-50/70 via-white to-emerald-50/40 border-emerald-200',
        icon: '🌿',
        hindiName: 'मेहँदी की रात',
        defaultAttire: 'Green / Floral Ethnic',
      };
    case 'SANGEET':
      return {
        badgeBg: 'bg-purple-100/90 text-purple-900 border-purple-300',
        cardBg: 'from-purple-50/70 via-white to-purple-50/40 border-purple-200',
        icon: '🎵',
        hindiName: 'संगीत संध्या',
        defaultAttire: 'Glitz & Glamour / Indo-Western',
      };
    case 'WEDDING':
      return {
        badgeBg: 'bg-rose-100/90 text-rose-900 border-rose-300',
        cardBg: 'from-rose-50/70 via-white to-amber-50/40 border-rose-200',
        icon: '🌺',
        hindiName: 'शुभ विवाह • पाणिग्रहण',
        defaultAttire: 'Traditional Royal Indian Attire',
      };
    case 'RECEPTION':
      return {
        badgeBg: 'bg-amber-100/90 text-amber-900 border-amber-300',
        cardBg: 'from-zinc-50 via-white to-amber-50/40 border-zinc-200',
        icon: '🥂',
        hindiName: 'प्रतिभोज • आशीर्वाद',
        defaultAttire: 'Formal / Evening Splendor',
      };
    default:
      return {
        badgeBg: 'bg-zinc-100 text-zinc-900 border-zinc-300',
        cardBg: 'from-zinc-50 via-white to-brand-ivory border-zinc-200',
        icon: '✨',
        hindiName: 'महोत्सव',
        defaultAttire: 'Festive Indian Wear',
      };
  }
}

export function PublicInviteCard({ token }: PublicInviteCardProps) {
  const [data, setData] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [status, setStatus] = useState<string>(RSVP_STATUS.ATTENDING);
  const [attendingCount, setAttendingCount] = useState<number>(1);
  const [dietary, setDietary] = useState<string>('ALL');
  const [wishes, setWishes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Celebration Flower Shower State
  const [showPetals, setShowPetals] = useState(false);

  useEffect(() => {
    async function loadInvite() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/public/invitations/${token}`);
        if (!res.ok) {
          throw new Error('This wedding invitation link is invalid or no longer active.');
        }
        const json = await res.json();
        const inv = json.data as InvitationData;
        setData(inv);

        // Pre-fill existing RSVP if already submitted
        if (inv.guest.rsvpStatus !== RSVP_STATUS.PENDING) {
          setStatus(inv.guest.rsvpStatus);
          setAttendingCount(inv.guest.attendingCount || 1);
          setDietary(inv.guest.dietary || 'ALL');
          setWishes(inv.guest.wishes || '');
          setIsSuccess(true);
        } else {
          setAttendingCount(inv.guest.maxGuests || 1);
          setDietary(inv.guest.dietary || 'ALL');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load invitation';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    if (token) loadInvite();
  }, [token]);

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        status,
        attendingCount: status === RSVP_STATUS.ATTENDING ? attendingCount : 0,
        dietary: status === RSVP_STATUS.ATTENDING ? dietary : undefined,
        wishes: wishes.trim() || null,
      };

      const res = await fetch(`/api/public/invitations/${token}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to submit RSVP');
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              guest: {
                ...prev.guest,
                rsvpStatus: status,
                attendingCount: status === RSVP_STATUS.ATTENDING ? attendingCount : 0,
                dietary,
                wishes: wishes.trim() || null,
              },
            }
          : null
      );
      setIsSuccess(true);
      setShowPetals(true);
      setTimeout(() => setShowPetals(false), 4500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting response';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBF7F0]">
        <div className="text-center space-y-4">
          <Logo size="lg" className="mx-auto animate-pulse" />
          <p className="text-base font-serif font-bold text-amber-900 tracking-wide">
            Opening your wedding invitation...
          </p>
          <p className="text-xs text-amber-700/80 italic font-serif">
            || श्री गणेशाय नमः ||
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBF7F0]">
        <div className="max-w-md w-full rounded-3xl border-2 border-amber-300 bg-white p-8 text-center space-y-4 shadow-xl">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-3xl">
            💌
          </div>
          <h2 className="text-2xl font-serif font-bold text-brand-crimson">
            Wedding Invitation
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {error || 'This invitation link could not be found. Please verify the URL or contact the wedding couple.'}
          </p>
        </div>
      </div>
    );
  }

  const { guest, wedding, events } = data;
  const coupleNames = `${wedding.groomName} & ${wedding.brideName}`;
  const weddingFormattedDate = new Date(wedding.weddingDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen py-8 sm:py-12 px-3 sm:px-6 lg:px-8 bg-[#F8F3EA] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Palace Motif Accents */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] bg-[radial-gradient(#b45309_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="pointer-events-none fixed -top-40 -left-40 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full bg-rose-200/40 blur-3xl" />

      {/* Celebratory Petals Overlay */}
      {showPetals && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden flex items-start justify-around">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="animate-bounce text-xl sm:text-2xl opacity-90 transition-all duration-1000"
              style={{
                animationDuration: `${1.5 + (i % 5) * 0.5}s`,
                animationDelay: `${(i % 10) * 0.2}s`,
              }}
            >
              {i % 2 === 0 ? '🌸' : '🌼'}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-2xl space-y-8 relative z-10">
        {/* ================================================================= */}
        {/* 1. ROYAL WEDDING CARD (Physical Patrika Experience) */}
        {/* ================================================================= */}
        <div className="relative rounded-3xl sm:rounded-4xl bg-[#FFFCF7] shadow-2xl overflow-hidden border-2 border-amber-300/80">
          {/* Ornate Gold Border Inset */}
          <div className="m-2.5 sm:m-4 rounded-2xl sm:rounded-3xl border border-amber-400/60 p-4 sm:p-8 relative overflow-hidden">
            {/* 4 Corner Flourishes */}
            <CornerFlourish className="top-1 left-1" />
            <CornerFlourish className="top-1 right-1 -scale-x-100" />
            <CornerFlourish className="bottom-1 left-1 -scale-y-100" />
            <CornerFlourish className="bottom-1 right-1 -scale-x-100 -scale-y-100" />

            <div className="text-center space-y-4 sm:space-y-5 relative z-10 py-2 sm:py-4">
              {/* Sacred Invocation (श्री गणेशाय नमः) */}
              <div className="space-y-1">
                <GaneshaEmblem className="h-12 w-12 sm:h-14 sm:w-14" />
                <div className="text-sm sm:text-base font-serif font-bold text-amber-800 tracking-widest">
                  ॥ श्री गणेशाय नमः ॥
                </div>
                <p className="text-[10px] sm:text-[11px] font-serif text-amber-900/80 italic max-w-sm mx-auto leading-relaxed">
                  वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।<br className="hidden sm:inline" />
                  निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥
                </p>
              </div>

              {/* Auspicious Opening Phrasing */}
              <div className="pt-2">
                <div className="inline-flex items-center gap-2">
                  <span className="h-px w-6 sm:w-12 bg-gradient-to-r from-transparent to-amber-400" />
                  <span className="text-[10px] sm:text-[11px] font-serif uppercase tracking-widest text-amber-700 font-bold">
                    शुभ विवाह निमंत्रण
                  </span>
                  <span className="h-px w-6 sm:w-12 bg-gradient-to-l from-transparent to-amber-400" />
                </div>
                <p className="text-xs sm:text-sm font-serif text-zinc-700 mt-2 max-w-md mx-auto leading-relaxed">
                  With the divine grace of the Almighty and the heartfelt blessings of our elders,
                  we cordially invite you and your family to celebrate the joyful union of
                </p>
              </div>

              {/* The Couple Regal Typography */}
              <div className="py-2 space-y-1">
                <div className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-brand-crimson drop-shadow-xs">
                  {wedding.groomName}
                </div>
                <div className="inline-flex items-center gap-3 my-1">
                  <span className="h-px w-8 sm:w-16 bg-amber-400/70" />
                  <span className="text-xs sm:text-sm font-serif italic text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50">
                    weds • संग
                  </span>
                  <span className="h-px w-8 sm:w-16 bg-amber-400/70" />
                </div>
                <div className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-brand-crimson drop-shadow-xs">
                  {wedding.brideName}
                </div>
              </div>

              {/* Auspicious Date & Destination Pill */}
              <div className="pt-1">
                <div className="inline-block rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-brand-ivory to-amber-50 px-5 py-3 shadow-xs">
                  <div className="text-xs sm:text-sm font-serif font-bold text-amber-950">
                    📅 {weddingFormattedDate}
                  </div>
                  {wedding.city && (
                    <div className="text-[11px] sm:text-xs text-amber-800 font-medium mt-0.5 flex items-center justify-center gap-1">
                      <span>📍</span>
                      <span>{wedding.city}, India</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Personalized Guest Invitation Scroll (सादर आमंत्रण) */}
              <div className="pt-4 max-w-lg mx-auto">
                <div className="relative rounded-2xl border-2 border-dashed border-amber-400/70 bg-gradient-to-b from-[#FFFDF9] to-[#FDF8EE] p-4 sm:p-5 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">
                    सादर आमंत्रण • To Our Esteemed Guest
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900">
                    {guest.name}
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                    Your gracious presence, prayers, and blessings will add warmth and joy to our sacred celebrations.
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-amber-900">
                    <span>
                      Reserved for your family:
                    </span>
                    <span className="rounded-lg bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                      🍽️ {guest.maxGuests} {guest.maxGuests === 1 ? 'Plate' : 'Plates'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Flower Shower Trigger Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPetals(true);
                    setTimeout(() => setShowPetals(false), 4000);
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 hover:text-amber-950 px-3 py-1 rounded-full border border-amber-300 bg-amber-50/70 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <span>🌸</span>
                  <span>Shower Flower Blessings (पुष्प वर्षा)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. CEREMONY ITINERARY CARDS (कार्यक्रम तालिका / Patrika Inserts) */}
        {/* ================================================================= */}
        {events.length > 0 && (
          <div className="rounded-3xl sm:rounded-4xl bg-white border border-amber-300/80 p-5 sm:p-8 shadow-xl space-y-5">
            <div className="text-center pb-3 border-b border-amber-100">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-serif font-bold text-amber-800 uppercase tracking-widest">
                <span>🪔</span>
                <span>कार्यक्रम पत्रिका • Ceremony Schedule</span>
                <span>🪔</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 mt-1">
                Celebration Itinerary
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Functions you are cordially invited to attend
              </p>
            </div>

            <div className="space-y-4">
              {events.map((ev) => {
                const startDate = new Date(ev.startsAt);
                const formattedDate = startDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
                const startTime = startDate.toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                const theme = getCeremonyTheming(ev.type);
                const googleCalUrl = createGoogleCalendarUrl(ev, coupleNames);
                const mapsQuery = ev.address || ev.venueName;

                return (
                  <div
                    key={ev.id}
                    className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md bg-gradient-to-r ${theme.cardBg}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{theme.icon}</span>
                          <h4 className="font-serif font-bold text-base sm:text-lg text-zinc-900">
                            {ev.name}
                          </h4>
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {theme.hindiName}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-brand-crimson">
                        📅 {formattedDate} • ⏰ {startTime}
                      </div>
                    </div>

                    {/* Venue & Location */}
                    {(ev.venueName || ev.address) && (
                      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-700">
                        <div>
                          {ev.venueName && (
                            <span className="font-bold text-zinc-900 block sm:inline">
                              📍 {ev.venueName}
                            </span>
                          )}
                          {ev.address && (
                            <span className="text-zinc-600 sm:ml-1">
                              — {ev.address}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                          {mapsQuery && (
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-brand-crimson hover:bg-amber-50 shadow-2xs transition-colors"
                            >
                              <span>🗺️</span>
                              <span>Map Navigation ↗</span>
                            </a>
                          )}

                          <a
                            href={googleCalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs transition-colors"
                          >
                            <span>📅</span>
                            <span>Add to Calendar</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Dress Code & Notes */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-wrap items-center gap-3 text-[11px]">
                      <div className="text-amber-900 font-semibold flex items-center gap-1">
                        <span>👗</span>
                        <span>
                          Dress Code: {ev.dressCode || theme.defaultAttire}
                        </span>
                      </div>
                      {ev.description && (
                        <div className="text-zinc-500 italic">
                          📝 {ev.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 3. CEREMONIAL RSVP SLIP (प्रतिउत्तर पत्र / Pratyuttar Patra) */}
        {/* ================================================================= */}
        <div className="rounded-3xl sm:rounded-4xl bg-white border-2 border-amber-300 p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Top Seal Stamp */}
          <div className="text-center pb-3 border-b border-amber-100">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-8 bg-amber-300" />
              <span className="text-[11px] font-serif font-bold text-amber-800 uppercase tracking-widest">
                प्रतिउत्तर पत्र • RSVP Card
              </span>
              <span className="h-px w-8 bg-amber-300" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-zinc-900 mt-1">
              Confirm Your Attendance
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kindly confirm your response to assist our caterers with exact feast arrangements
            </p>
          </div>

          {/* Success Banner if RSVP already recorded */}
          {isSuccess && (
            <div className="rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-emerald-50 border-2 border-emerald-300 p-6 sm:p-8 text-center space-y-3 shadow-md">
              <div className="text-4xl animate-bounce">🎉</div>
              <h4 className="text-xl font-serif font-bold text-emerald-950">
                {status === RSVP_STATUS.ATTENDING
                  ? 'Attendance Confirmed! See You At The Wedding!'
                  : 'Response Recorded With Sincere Thanks'}
              </h4>
              <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                {status === RSVP_STATUS.ATTENDING
                  ? `Thank you! We have reserved ${attendingCount} ${
                      attendingCount === 1 ? 'plate' : 'plates'
                    } for ${guest.name}. We look forward to celebrating together!`
                  : `We will miss your presence at our festivities. Thank you for conveying your warm blessings!`}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-semibold text-brand-crimson transition-colors cursor-pointer"
                >
                  ✏️ Need to modify your attendance? Click here
                </button>
              </div>
            </div>
          )}

          {!isSuccess && (
            <form onSubmit={handleSubmitRsvp} className="space-y-6">
              {submitError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-300 p-3.5 text-xs text-rose-800 font-medium">
                  ⚠️ {submitError}
                </div>
              )}

              {/* Status Choice: Attending vs Declined */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStatus(RSVP_STATUS.ATTENDING)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    status === RSVP_STATUS.ATTENDING
                      ? 'border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/40'
                  }`}
                >
                  <div className="text-2xl">🎉</div>
                  <div className="font-serif font-bold text-base text-zinc-900 mt-1.5">
                    Joyfully Accepts
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    सहर्ष स्वीकार
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    We will be there to bless the couple!
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus(RSVP_STATUS.NOT_ATTENDING)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    status === RSVP_STATUS.NOT_ATTENDING
                      ? 'border-amber-700 bg-amber-50/70 shadow-md ring-2 ring-amber-600/20'
                      : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50/40'
                  }`}
                >
                  <div className="text-2xl">💌</div>
                  <div className="font-serif font-bold text-base text-zinc-900 mt-1.5">
                    Regretfully Declines
                  </div>
                  <div className="text-[11px] font-bold text-amber-700">
                    सादर शुभकामनाएं
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Sending heartfelt wishes from afar.
                  </div>
                </button>
              </div>

              {/* Attending Details: Headcount & Dietary */}
              {status === RSVP_STATUS.ATTENDING && (
                <div className="space-y-4 pt-4 border-t border-amber-100">
                  {/* Attending Count */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="attendingCount"
                        className="text-xs font-semibold uppercase tracking-wider text-zinc-800"
                      >
                        Number of Attending Guests (Plates)
                      </label>
                      <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Max Capacity: {guest.maxGuests} {guest.maxGuests === 1 ? 'Plate' : 'Plates'}
                      </span>
                    </div>

                    <select
                      id="attendingCount"
                      value={attendingCount}
                      onChange={(e) => setAttendingCount(parseInt(e.target.value))}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-3 text-sm text-zinc-900 font-semibold focus:border-brand-crimson focus:outline-hidden cursor-pointer"
                    >
                      {Array.from({ length: guest.maxGuests }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest (1 Caterer Plate)' : `Guests (${num} Caterer Plates)`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary Preference for Caterer */}
                  <div>
                    <label
                      htmlFor="dietary"
                      className="block text-xs font-semibold uppercase tracking-wider text-zinc-800 mb-1.5"
                    >
                      Dietary Requirement (भोजन व्यवस्था)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { val: 'PURE_VEG', label: 'Pure Veg', hindi: 'शुद्ध शाकाहारी', icon: '🌱' },
                        { val: 'JAIN', label: 'Jain Food', hindi: 'जैन (No Root Veg)', icon: '🟡' },
                        { val: 'NON_VEG', label: 'Non-Veg', hindi: 'मांसाहारी', icon: '🍗' },
                        { val: 'ALL', label: 'No Preference', hindi: 'सभी व्यंजन', icon: '✨' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDietary(item.val)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            dietary === item.val
                              ? 'border-brand-crimson bg-brand-crimson/10 font-bold text-brand-crimson shadow-2xs'
                              : 'border-zinc-200 hover:border-zinc-300 bg-white text-zinc-700'
                          }`}
                        >
                          <div className="text-lg">{item.icon}</div>
                          <div className="text-xs font-semibold mt-1">{item.label}</div>
                          <div className="text-[10px] text-zinc-500">{item.hindi}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Wishes / Message for the Couple */}
              <div>
                <label
                  htmlFor="wishes"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-800 mb-1.5"
                >
                  Warm Wishes & Aashirwad (आशीर्वाद संदेश)
                </label>
                <textarea
                  id="wishes"
                  rows={3}
                  value={wishes}
                  onChange={(e) => setWishes(e.target.value)}
                  placeholder={`Send your blessings, love, and wishes to ${coupleNames}...`}
                  className="w-full rounded-xl border border-zinc-300 p-3.5 text-sm text-zinc-900 placeholder-zinc-400 focus:border-brand-crimson focus:outline-hidden resize-none"
                />
              </div>

              {/* Royal Golden Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-crimson via-brand-crimson to-amber-700 py-4 text-base font-serif font-bold text-white shadow-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Confirming with Caterer...</span>
                  </>
                ) : (
                  <span>
                    {status === RSVP_STATUS.ATTENDING
                      ? 'Confirm Attendance & Reserve Plates ✨'
                      : 'Submit Response (सादर प्रेषित) 💌'}
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Traditional Indian Card Footer (दर्शनाभिलाषी) */}
        <div className="text-center space-y-2 py-4">
          <div className="text-xs font-serif font-bold text-amber-900 tracking-wider">
            दर्शनाभिलाषी • With Best Compliments From
          </div>
          <p className="text-xs font-serif text-zinc-600 italic">
            All Relatives, Friends & The Family of {wedding.groomName} & {wedding.brideName}
          </p>
          <div className="text-[10px] text-zinc-400 pt-2">
            Make My Marriage • Digital Wedding Operating System
          </div>
        </div>
      </div>
    </div>
  );
}
