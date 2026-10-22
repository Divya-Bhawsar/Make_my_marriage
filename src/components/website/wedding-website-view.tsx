'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { PublicWeddingDTO } from '@/modules/wedding/wedding.service';
import {
  getThemeConfig,
  extractYouTubeVideoId,
  normalizeGoogleMeetUrl,
  extractGoogleMeetCode,
  getScheduledCallStatus,
} from './website-theme-styles';
import { Logo } from '@/components/landing/logo';

interface WeddingWebsiteViewProps {
  wedding: PublicWeddingDTO;
  isPreview?: boolean;
}

export function WeddingWebsiteView({ wedding, isPreview = false }: WeddingWebsiteViewProps) {
  const theme = useMemo(() => getThemeConfig(wedding.theme), [wedding.theme]);
  const rawMeet = wedding.livestream?.meetingUrl;
  const rawYt = wedding.livestream?.youtubeUrl;
  const isGoogleMeet =
    wedding.livestream?.provider === 'GOOGLE_MEET' ||
    Boolean(rawMeet && rawMeet.includes('meet.google.com')) ||
    Boolean(rawYt && rawYt.includes('meet.google.com'));

  const effectiveMeetUrl = rawMeet || (rawYt && rawYt.includes('meet.google.com') ? rawYt : null);
  const effectiveYoutubeUrl = rawYt && !rawYt.includes('meet.google.com') ? rawYt : null;

  const videoId = useMemo(
    () => extractYouTubeVideoId(effectiveYoutubeUrl),
    [effectiveYoutubeUrl]
  );

  const normalizedMeetUrl = useMemo(
    () => normalizeGoogleMeetUrl(effectiveMeetUrl),
    [effectiveMeetUrl]
  );
  const meetCode = useMemo(
    () => extractGoogleMeetCode(effectiveMeetUrl),
    [effectiveMeetUrl]
  );
  const [copiedMeet, setCopiedMeet] = useState(false);

  const scheduledCallStatus = useMemo(
    () =>
      getScheduledCallStatus(
        wedding.livestream?.scheduledStartTime,
        wedding.timeZone || 'Asia/Kolkata'
      ),
    [wedding.livestream?.scheduledStartTime, wedding.timeZone]
  );

  const handleCopyMeet = () => {
    if (normalizedMeetUrl) {
      navigator.clipboard.writeText(normalizedMeetUrl);
      setCopiedMeet(true);
      setTimeout(() => setCopiedMeet(false), 2000);
    }
  };

  // Calculate days to go
  const daysToGo = useMemo(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(wedding.weddingDate);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  }, [wedding.weddingDate]);

  // Formatted wedding date
  const formattedDate = useMemo(() => {
    try {
      return new Date(wedding.weddingDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return wedding.weddingDate;
    }
  }, [wedding.weddingDate]);

  const destinationCity =
    wedding.location?.city || wedding.location?.formattedAddress || 'India';

  const coupleHeading =
    wedding.title || `${wedding.groomName} & ${wedding.brideName}`;

  const prefilledWhatsAppMessage = encodeURIComponent(
    `Namaste ${wedding.groomName} & ${wedding.brideName}! Heartiest congratulations on your upcoming wedding! We received your wedding invitation and would love to be part of the auspicious celebrations.`
  );

  return (
    <div className={`min-h-screen bg-gradient-to-b ${theme.bgGradient} font-sans text-brand-charcoal`}>
      {/* Draft Preview Banner for Authenticated Couple */}
      {isPreview && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white text-xs font-bold py-2.5 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <span>👁️</span>
          <span>
            Preview Mode — This website is currently unpublished. Only you can view this page until published in the dashboard.
          </span>
          <Link
            href="/app/website"
            className="ml-2 underline font-extrabold hover:text-amber-100"
          >
            Go to Settings &rarr;
          </Link>
        </div>
      )}

      {/* Floating Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-sand/60">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <Logo size="sm" />
            <div className="flex flex-col min-w-0">
              <span className={`font-serif font-extrabold text-sm sm:text-base tracking-tight truncate ${theme.accentText}`}>
                {wedding.groomName} &amp; {wedding.brideName}
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-brand-gold">
                Shubh Vivah
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1.5 sm:gap-3 text-xs font-semibold text-brand-charcoal/80 shrink-0">
            <a
              href="#itinerary"
              className="px-2.5 py-1 rounded-lg hover:text-brand-crimson hover:bg-black/5 transition-colors"
            >
              Ceremonies
            </a>
            {wedding.livestream?.isEnabled && (
              <a
                href="#livestream"
                className="px-2.5 py-1 rounded-lg hover:text-brand-crimson hover:bg-black/5 transition-colors flex items-center gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                <span className="hidden xs:inline">Live Stream</span>
                <span className="xs:hidden">Live</span>
              </a>
            )}
            <a
              href={`https://wa.me/?text=${prefilledWhatsAppMessage}`}
              target="_blank"
              rel="noreferrer"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1 ${theme.buttonClass}`}
            >
              <span className="hidden sm:inline">RSVP on WhatsApp</span>
              <span className="sm:hidden">RSVP</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 text-center px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Ganesh Shloka */}
          <div className="inline-block">
            <span className={`text-sm sm:text-base font-serif tracking-widest font-bold ${theme.accentText}`}>
              ॥ श्री गणेशाय नमः ॥
            </span>
          </div>

          {/* Couple Heading */}
          <div className="space-y-3">
            <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold font-serif tracking-tight ${theme.headingColor}`}>
              {wedding.groomName}
              <span className="block sm:inline sm:mx-3 text-3xl sm:text-5xl font-serif text-brand-gold/80 italic font-normal">
                &amp;
              </span>
              {wedding.brideName}
            </h1>

            <p className="text-base sm:text-lg font-serif italic text-brand-charcoal/70 max-w-xl mx-auto">
              Together with their families, cordially invite you to celebrate their wedding festivities.
            </p>
          </div>

          {/* Auspicious Date & Destination Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <div className={`px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${theme.badgeClass}`}>
              <span>📅</span>
              <span>{formattedDate}</span>
            </div>

            <div className={`px-4 py-2 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${theme.secondaryBadgeClass}`}>
              <span>📍</span>
              <span>{destinationCity}</span>
            </div>

            {daysToGo !== null && (
              <div className="px-4 py-2 rounded-2xl bg-white border border-brand-sand/80 shadow-xs text-xs sm:text-sm font-bold text-brand-charcoal flex items-center gap-2">
                <span>⏳</span>
                <span>
                  {daysToGo > 0
                    ? `${daysToGo} Days to Go`
                    : daysToGo === 0
                    ? 'Celebrating Today! 🎉'
                    : 'Happily Married 💍'}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Welcome & Couple Story Section */}
      <section className="max-w-3xl mx-auto px-4 py-6">
        <div className={`${theme.cardBg} border ${theme.borderClass} rounded-3xl p-6 sm:p-10 shadow-sm text-center space-y-4`}>
          <span className="text-2xl">🪔</span>
          <h2 className={`text-2xl sm:text-3xl font-bold font-serif ${theme.headingColor}`}>
            Welcome to Our Celebration
          </h2>
          <p className="text-sm sm:text-base text-brand-charcoal/80 leading-relaxed font-serif max-w-2xl mx-auto">
            {wedding.welcomeMessage ||
              'We are thrilled to embark on this beautiful sacred journey of marriage surrounded by the love, laughter, and blessings of our dearest family and friends. Your presence will make our celebration complete.'}
          </p>

          {wedding.description && (
            <p className="text-xs sm:text-sm text-brand-charcoal/70 leading-relaxed pt-2 border-t border-brand-sand/40 max-w-xl mx-auto">
              {wedding.description}
            </p>
          )}
        </div>
      </section>

      {/* Ceremonies & Itinerary Section */}
      <section id="itinerary" className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold">
            Sacred Auspicious Muhurats
          </span>
          <h2 className={`text-3xl sm:text-4xl font-extrabold font-serif ${theme.headingColor}`}>
            Wedding Ceremonies &amp; Itinerary
          </h2>
          <p className="text-xs sm:text-sm text-brand-charcoal/70">
            Join us for all sacred rituals, festive music, and auspicious pheras.
          </p>
        </div>

        {wedding.events.length === 0 ? (
          <div className="text-center py-10 bg-white/80 rounded-2xl border border-brand-sand p-6">
            <span className="text-3xl block mb-2">🪔</span>
            <p className="text-sm text-brand-charcoal/70">
              Ceremonial itinerary details will be updated here shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {wedding.events.map((evt) => {
              const eventDateStr = new Date(evt.startsAt).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const eventTimeStr = new Date(evt.startsAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={evt.id}
                  className={`${theme.cardBg} border ${theme.borderClass} rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between`}
                >
                  <div>
                    {/* Top Type & Timing */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badgeClass}`}>
                        {evt.type}
                      </span>
                      <span className="text-xs font-semibold text-brand-charcoal/70 flex items-center gap-1">
                        <span>⏰</span>
                        <span>{eventTimeStr}</span>
                      </span>
                    </div>

                    {/* Ceremony Name */}
                    <h3 className={`text-xl font-bold font-serif ${theme.headingColor} mb-2`}>
                      {evt.name}
                    </h3>

                    {/* Date & Venue Details */}
                    <div className="space-y-1.5 text-xs text-brand-charcoal/80 mb-3">
                      <div className="flex items-center gap-2 font-medium">
                        <span>📅</span>
                        <span>{eventDateStr}</span>
                      </div>

                      {evt.venueName && (
                        <div className="flex items-start gap-2">
                          <span>🏛️</span>
                          <span className="font-semibold">{evt.venueName}</span>
                        </div>
                      )}

                      {evt.address && (
                        <div className="flex items-start gap-2">
                          <span>📍</span>
                          <span className="line-clamp-2 text-brand-charcoal/70">{evt.address}</span>
                        </div>
                      )}

                      {evt.dressCode && (
                        <div className="flex items-center gap-2 pt-1">
                          <span>👗</span>
                          <span className="font-semibold text-brand-gold">{evt.dressCode}</span>
                        </div>
                      )}
                    </div>

                    {evt.description && (
                      <p className="text-xs text-brand-charcoal/70 italic mb-3">
                        &quot;{evt.description}&quot;
                      </p>
                    )}
                  </div>

                  {/* Google Maps Direction Action */}
                  <div className="pt-3 border-t border-brand-sand/60 flex items-center justify-end">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${evt.venueName || ''} ${evt.address || destinationCity}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`text-xs font-bold underline hover:text-brand-crimson flex items-center gap-1 ${theme.accentText}`}
                    >
                      <span>Get Directions</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Live Stream / Virtual Ceremony Room Section */}
      {wedding.livestream?.isEnabled && (
        <section id="livestream" className="max-w-4xl mx-auto px-4 py-12">
          <div className={`${theme.cardBg} border ${theme.borderClass} rounded-3xl p-6 sm:p-8 shadow-sm space-y-6`}>
            {isGoogleMeet ? (
              /* Google Meet Virtual Room */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-sand/60 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                      <span>Virtual Baithak &amp; Live Room</span>
                    </div>
                    <h3 className={`text-2xl font-bold font-serif ${theme.headingColor}`}>
                      Virtual Wedding Ceremony Room
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 mt-0.5">
                      Join our live Google Meet call to give your blessings, see family members, and witness our sacred rituals in real time.
                    </p>
                    {scheduledCallStatus && (
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-brand-sand/80 rounded-xl text-xs font-semibold text-brand-charcoal shadow-xs">
                          <span>🕒</span>
                          <span>{scheduledCallStatus.formattedTime}</span>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                            scheduledCallStatus.isLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : scheduledCallStatus.isUpcoming
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          <span>⏳</span>
                          <span>{scheduledCallStatus.countdownText}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {normalizedMeetUrl ? (
                  <div className="bg-linear-to-br from-emerald-50 via-teal-50/50 to-stone-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-5 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-4xl">🎥</span>
                      <div className="text-left">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                          Google Meet Active
                        </span>
                        <span className="text-sm font-semibold text-brand-charcoal font-mono">
                          {meetCode ? `Meet Code: ${meetCode}` : normalizedMeetUrl}
                        </span>
                      </div>
                    </div>

                    {wedding.livestream?.instructions && (
                      <div className="max-w-lg mx-auto p-3.5 bg-white/90 border border-emerald-200/80 rounded-xl text-xs text-brand-charcoal/80 text-left">
                        <span className="font-bold text-emerald-900 block mb-0.5">
                          🎙️ Host Family Note:
                        </span>
                        <p className="italic">&quot;{wedding.livestream.instructions}&quot;</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <a
                        href={normalizedMeetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2"
                      >
                        <span>🚀</span>
                        <span>Join Google Meet Room ↗</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyMeet}
                        className="px-4 py-3 bg-white hover:bg-stone-100 text-brand-charcoal font-semibold text-xs border border-brand-sand rounded-xl shadow-xs transition-colors"
                      >
                        {copiedMeet ? '✓ Link Copied!' : '📋 Copy Meeting Link'}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `Namaste! Join ${coupleHeading}'s wedding celebrations live on Google Meet: ${normalizedMeetUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-semibold text-xs border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <span>💬</span>
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-2xl border border-brand-sand p-6">
                    <span className="text-4xl block mb-2">📹</span>
                    <h4 className="text-base font-bold text-brand-charcoal font-serif">
                      Google Meet Call Scheduled
                    </h4>
                    <p className="text-xs text-brand-charcoal/60 mt-1 max-w-md mx-auto">
                      The virtual ceremony Google Meet link will be activated here prior to the muhurat. Please check back soon!
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* YouTube Live Broadcast */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-sand/60 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider mb-1">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                      <span>Live Broadcast</span>
                    </div>
                    <h3 className={`text-2xl font-bold font-serif ${theme.headingColor}`}>
                      Wedding Live Streaming
                    </h3>
                    <p className="text-xs text-brand-charcoal/70 mt-0.5">
                      For our NRI and overseas family members unable to travel, watch our sacred rituals in real time.
                    </p>
                    {scheduledCallStatus && (
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-brand-sand/80 rounded-xl text-xs font-semibold text-brand-charcoal shadow-xs">
                          <span>🕒</span>
                          <span>{scheduledCallStatus.formattedTime}</span>
                        </div>
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                            scheduledCallStatus.isLive
                              ? 'bg-red-500 text-white animate-pulse'
                              : scheduledCallStatus.isUpcoming
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          <span>⏳</span>
                          <span>{scheduledCallStatus.countdownText}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {videoId ? (
                  <div className="space-y-3">
                    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-black/10 bg-black aspect-video">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`}
                        title={`${coupleHeading} Wedding Live Stream`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                    <div className="text-right">
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-brand-crimson font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Watch directly on YouTube</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-stone-50 rounded-2xl border border-brand-sand p-6">
                    <span className="text-4xl block mb-2">📹</span>
                    <h4 className="text-base font-bold text-brand-charcoal font-serif">
                      Livestream Broadcast Scheduled
                    </h4>
                    <p className="text-xs text-brand-charcoal/60 mt-1 max-w-md mx-auto">
                      The live YouTube stream link will become active on the ceremony day. Please check back here to watch live!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* RSVP on WhatsApp Section */}
      <section className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="bg-linear-to-r from-emerald-900 to-teal-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-4">
          <span className="text-3xl block">💌</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-200">
            Confirm Your Blessings &amp; Attendance
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-lg mx-auto">
            Please let Vivek &amp; Eisha know if you will be able to celebrate with them in person in {destinationCity}.
          </p>
          <div className="pt-2">
            <a
              href={`https://wa.me/?text=${prefilledWhatsAppMessage}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl shadow-lg transition-transform hover:scale-105"
            >
              <span>💬</span>
              <span>Send Wishes &amp; RSVP via WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* Luxury Footer */}
      <footer className="border-t border-brand-sand/60 py-10 text-center text-xs text-brand-charcoal/60 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Logo size="sm" />
          <span className="font-serif font-bold text-brand-charcoal">Make My Marriage</span>
        </div>
        <p className="font-serif italic">
          Shubh Vivah • {wedding.groomName} &amp; {wedding.brideName}
        </p>
        <p className="text-[11px] text-brand-charcoal/40">
          The Operating System for Managing an Indian Wedding
        </p>
      </footer>
    </div>
  );
}
