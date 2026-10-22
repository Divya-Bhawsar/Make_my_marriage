'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  WEBSITE_THEMES,
  extractYouTubeVideoId,
  normalizeGoogleMeetUrl,
  extractGoogleMeetCode,
  getScheduledCallStatus,
} from './website-theme-styles';

interface WebsiteSettings {
  slug: string;
  theme: string;
  isPublished: boolean;
  welcomeMessage: string | null;
}

interface LivestreamSettings {
  provider?: 'YOUTUBE' | 'GOOGLE_MEET';
  youtubeUrl: string | null;
  meetingUrl: string | null;
  instructions: string | null;
  scheduledStartTime: string | null;
  isEnabled: boolean;
}

interface CeremonyOption {
  id: string;
  name: string;
  type: string;
  startsAt: string;
}

export function WebsiteManager() {
  const [website, setWebsite] = useState<WebsiteSettings | null>(null);
  const [livestream, setLivestream] = useState<LivestreamSettings | null>(null);
  const [ceremonies, setCeremonies] = useState<CeremonyOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [theme, setTheme] = useState('crimson');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [streamProvider, setStreamProvider] = useState<'YOUTUBE' | 'GOOGLE_MEET'>('YOUTUBE');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [scheduledStartTime, setScheduledStartTime] = useState('');
  const [isLivestreamEnabled, setIsLivestreamEnabled] = useState(false);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [webRes, liveRes, eventsRes] = await Promise.all([
        fetch('/api/wedding/website'),
        fetch('/api/wedding/livestream'),
        fetch('/api/events'),
      ]);

      const [webJson, liveJson, eventsJson] = await Promise.all([
        webRes.json(),
        liveRes.json(),
        eventsRes.json(),
      ]);

      if (webRes.ok && webJson.data) {
        setWebsite(webJson.data);
        setTheme(webJson.data.theme || 'crimson');
        setWelcomeMessage(webJson.data.welcomeMessage || '');
        setIsPublished(webJson.data.isPublished || false);
      }

      if (liveRes.ok && liveJson.data) {
        let prov = liveJson.data.provider || 'YOUTUBE';
        let yt = liveJson.data.youtubeUrl || '';
        let meet = liveJson.data.meetingUrl || '';
        if (yt && yt.includes('meet.google.com')) {
          meet = yt;
          yt = '';
          prov = 'GOOGLE_MEET';
        }

        setLivestream(liveJson.data);
        setStreamProvider(prov);
        setYoutubeUrl(yt);
        setMeetingUrl(meet);
        setInstructions(liveJson.data.instructions || '');

        if (liveJson.data.scheduledStartTime) {
          try {
            const dt = new Date(liveJson.data.scheduledStartTime);
            const pad = (n: number) => String(n).padStart(2, '0');
            const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
              dt.getHours()
            )}:${pad(dt.getMinutes())}`;
            setScheduledStartTime(local);
          } catch {
            setScheduledStartTime(liveJson.data.scheduledStartTime);
          }
        } else {
          setScheduledStartTime('');
        }

        setIsLivestreamEnabled(liveJson.data.isEnabled || false);
      }

      if (eventsRes.ok && eventsJson.data) {
        setCeremonies(eventsJson.data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const previewVideoId = useMemo(() => extractYouTubeVideoId(youtubeUrl), [youtubeUrl]);
  const previewMeetUrl = useMemo(() => normalizeGoogleMeetUrl(meetingUrl), [meetingUrl]);
  const previewMeetCode = useMemo(() => extractGoogleMeetCode(meetingUrl), [meetingUrl]);
  const previewScheduledStatus = useMemo(
    () =>
      scheduledStartTime
        ? getScheduledCallStatus(new Date(scheduledStartTime).toISOString())
        : null,
    [scheduledStartTime]
  );

  const publicUrl = useMemo(() => {
    if (!website?.slug) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/w/${website.slug}`;
    }
    return `/w/${website.slug}`;
  }, [website?.slug]);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const [webRes, liveRes] = await Promise.all([
        fetch('/api/wedding/website', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme,
            welcomeMessage: welcomeMessage.trim() || null,
            isPublished,
          }),
        }),
        fetch('/api/wedding/livestream', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: streamProvider,
            youtubeUrl: youtubeUrl.trim() || null,
            meetingUrl: meetingUrl.trim() || null,
            instructions: instructions.trim() || null,
            scheduledStartTime: scheduledStartTime
              ? new Date(scheduledStartTime).toISOString()
              : null,
            isEnabled: isLivestreamEnabled,
          }),
        }),
      ]);

      const [webJson, liveJson] = await Promise.all([webRes.json(), liveRes.json()]);

      if (!webRes.ok) {
        throw new Error(webJson.error?.message || 'Failed to update website settings');
      }
      if (!liveRes.ok) {
        throw new Error(liveJson.error?.message || 'Failed to update livestream settings');
      }

      setFeedback({ type: 'success', text: '✓ Wedding website and livestream settings saved successfully!' });
      fetchSettings();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error updating settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-20 bg-brand-sand/40 rounded-2xl" />
        <div className="h-64 bg-brand-sand/40 rounded-2xl" />
      </div>
    );
  }

  const themesList = [
    WEBSITE_THEMES.crimson,
    WEBSITE_THEMES.marigold,
    WEBSITE_THEMES.emerald,
    WEBSITE_THEMES.gulabi,
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-brand-charcoal">
            Themed Wedding Website &amp; Live Stream
          </h2>
          <p className="text-xs text-brand-charcoal/70 mt-1">
            Choose an auspicious design theme, configure YouTube live streaming for overseas family, and publish your wedding website.
          </p>
        </div>

        {website?.slug && (
          <div className="flex items-center gap-2">
            <a
              href={`/w/${website.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-brand-crimson text-white text-xs font-bold rounded-xl hover:bg-brand-crimson/90 transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span>View Live Website ↗</span>
            </a>
          </div>
        )}
      </div>

      {/* Website Status & Share Card */}
      <div className="bg-white border border-brand-sand rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-sm font-bold text-brand-charcoal font-serif">
              Status: {isPublished ? 'Published & Live' : 'Draft / Unpublished'}
            </span>
          </div>
          <p className="text-xs text-brand-charcoal/60">
            {isPublished
              ? 'Your public wedding website is accessible to all family, friends, and invited guests.'
              : 'Only wedding organizers can preview this site. Toggle "Publish Website" below to go live!'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-brand-sand/20 border border-brand-sand rounded-xl font-mono text-brand-charcoal select-all">
            /w/{website?.slug}
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-brand-sand/50 hover:bg-brand-sand text-brand-charcoal font-semibold rounded-xl transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Namaste! We are delighted to share our wedding website: ${publicUrl}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
          >
            <span>💬</span>
            <span>Share</span>
          </a>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Choose Wedding Theme */}
        <div className="bg-white border border-brand-sand rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold font-serif text-brand-charcoal">
              1. Choose Wedding Design Theme
            </h3>
            <p className="text-xs text-brand-charcoal/60 mt-0.5">
              Select a cultural color aesthetic that represents your wedding celebrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {themesList.map((t) => {
              const isSelected = theme.toLowerCase() === t.id.toLowerCase();
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? `${t.borderClass} bg-white shadow-md ring-2 ring-brand-gold`
                      : 'border-brand-sand/60 bg-stone-50/50 hover:bg-white hover:border-brand-sand'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="h-6 w-6 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: t.swatchColor }}
                    />
                    {isSelected && (
                      <span className="text-xs font-bold text-brand-crimson">✓ Selected</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-brand-charcoal font-serif">{t.name}</h4>
                  <p className="text-[11px] text-brand-charcoal/60 mt-0.5">{t.tag}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Welcome Message & Love Story */}
        <div className="bg-white border border-brand-sand rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold font-serif text-brand-charcoal">
              2. Welcome Message &amp; Couple Story
            </h3>
            <p className="text-xs text-brand-charcoal/60 mt-0.5">
              Personalized greeting displayed at the top of your wedding website.
            </p>
          </div>

          <div>
            <textarea
              rows={4}
              placeholder="e.g. We are thrilled to celebrate our special day with our dearest family and friends. Join us in Indore for our Haldi, Mehendi, Sangeet, and Shubh Vivah!"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold resize-none"
            />
          </div>
        </div>

        {/* Section 3: Live Video Stream & Virtual Attendance */}
        <div className="bg-white border border-brand-sand rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-serif text-brand-charcoal flex items-center gap-2">
                <span>3. Live Video Stream &amp; Virtual Room</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                  NRI &amp; Overseas Family
                </span>
              </h3>
              <p className="text-xs text-brand-charcoal/60 mt-0.5">
                Enable live video broadcast on YouTube or an interactive Google Meet room for distant family.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-brand-charcoal">
              <input
                type="checkbox"
                checked={isLivestreamEnabled}
                onChange={(e) => setIsLivestreamEnabled(e.target.checked)}
                className="rounded-sm border-brand-sand text-brand-crimson focus:ring-brand-gold"
              />
              <span>Enable Stream / Room</span>
            </label>
          </div>

          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStreamProvider('YOUTUBE')}
              disabled={!isLivestreamEnabled}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                streamProvider === 'YOUTUBE'
                  ? 'border-red-500 bg-red-50/60 ring-2 ring-red-400'
                  : 'border-brand-sand/60 bg-white hover:bg-stone-50'
              } ${!isLivestreamEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">🔴</span>
              <div>
                <span className="text-xs font-bold text-brand-charcoal block">
                  YouTube Live
                </span>
                <span className="text-[11px] text-brand-charcoal/60 block">
                  16:9 embedded video broadcast
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setStreamProvider('GOOGLE_MEET')}
              disabled={!isLivestreamEnabled}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                streamProvider === 'GOOGLE_MEET'
                  ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-400'
                  : 'border-brand-sand/60 bg-white hover:bg-stone-50'
              } ${!isLivestreamEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl">🟢</span>
              <div>
                <span className="text-xs font-bold text-brand-charcoal block">
                  Google Meet
                </span>
                <span className="text-[11px] text-brand-charcoal/60 block">
                  Interactive virtual family call
                </span>
              </div>
            </button>
          </div>

          {streamProvider === 'YOUTUBE' ? (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  YouTube Video or Live Stream URL
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtube.com/live/..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('meet.google.com')) {
                      setStreamProvider('GOOGLE_MEET');
                      setMeetingUrl(val);
                      setYoutubeUrl('');
                    } else {
                      setYoutubeUrl(val);
                    }
                  }}
                  disabled={!isLivestreamEnabled}
                  className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {isLivestreamEnabled && previewVideoId && (
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-brand-charcoal/60 block mb-1.5">
                    Live Embed Preview (Video ID: {previewVideoId})
                  </span>
                  <div className="relative w-full max-w-md rounded-xl overflow-hidden aspect-video border border-black/10 bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${previewVideoId}`}
                      title="YouTube Preview"
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  Google Meet Link or Meeting Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://meet.google.com/abc-defg-hij or code abc-defg-hij"
                  value={meetingUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('youtube.com') || val.includes('youtu.be')) {
                      setStreamProvider('YOUTUBE');
                      setYoutubeUrl(val);
                      setMeetingUrl('');
                    } else {
                      setMeetingUrl(val);
                    }
                  }}
                  disabled={!isLivestreamEnabled}
                  className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold disabled:bg-gray-100 disabled:text-gray-400"
                />
                <p className="text-[11px] text-brand-charcoal/60 mt-1">
                  You can paste the full Google Meet link or just the 10-letter meeting code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal mb-1">
                  Host Family Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please keep your microphone muted during the Vedic Pheras. You can unmute and talk with the couple during Varmala & Reception!"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  disabled={!isLivestreamEnabled}
                  className="w-full px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              {isLivestreamEnabled && previewMeetUrl && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-900 block">
                      Active Google Meet Room
                    </span>
                    <span className="text-[11px] font-mono text-emerald-800">
                      {previewMeetUrl}
                    </span>
                  </div>
                  <a
                    href={previewMeetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                  >
                    Test Join ↗
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Scheduled Call Time & Countdown */}
          <div className="pt-3 border-t border-brand-sand/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal">
                  Scheduled Start Time &amp; Live Countdown (IST)
                </label>
                <p className="text-[11px] text-brand-charcoal/60">
                  Overseas guests will see the exact time and a live countdown badge on your website.
                </p>
              </div>

              {previewScheduledStatus && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                    previewScheduledStatus.isLive
                      ? 'bg-red-500 text-white animate-pulse'
                      : previewScheduledStatus.isUpcoming
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>⏳</span>
                  <span>Guest View: {previewScheduledStatus.countdownText}</span>
                </div>
              )}
            </div>

            <input
              type="datetime-local"
              value={scheduledStartTime}
              onChange={(e) => setScheduledStartTime(e.target.value)}
              disabled={!isLivestreamEnabled}
              className="w-full sm:w-80 px-3.5 py-2 text-xs border border-brand-sand rounded-xl bg-white focus:outline-hidden focus:border-brand-gold disabled:bg-gray-100 disabled:text-gray-400"
            />

            {/* Quick-select pills from Wedding Itinerary */}
            {ceremonies.length > 0 && isLivestreamEnabled && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-brand-charcoal/60 block">
                  Quick Select from Wedding Itinerary:
                </span>
                <div className="flex flex-wrap gap-2">
                  {ceremonies.map((c) => {
                    const dt = new Date(c.startsAt);
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const localIso = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
                      dt.getDate()
                    )}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
                    const timeLabel = dt.toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const dateLabel = dt.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    });

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setScheduledStartTime(localIso)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 ${
                          scheduledStartTime === localIso
                            ? 'bg-brand-crimson text-white border-brand-crimson font-bold'
                            : 'bg-stone-50 hover:bg-stone-100 text-brand-charcoal border-brand-sand/70'
                        }`}
                      >
                        <span>📅</span>
                        <span>
                          {c.name} ({dateLabel}, {timeLabel})
                        </span>
                      </button>
                    );
                  })}
                  {scheduledStartTime && (
                    <button
                      type="button"
                      onClick={() => setScheduledStartTime('')}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800 font-semibold underline"
                    >
                      Clear Time
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Publishing Status Toggle */}
        <div className="bg-white border border-brand-sand rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-serif text-brand-charcoal">
              4. Publication Visibility
            </h3>
            <p className="text-xs text-brand-charcoal/60 mt-0.5">
              Make your wedding website visible to the public or keep it in private draft mode.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded-sm border-brand-sand text-brand-crimson focus:ring-brand-gold h-4 w-4"
            />
            <span className="text-xs font-bold text-brand-charcoal">
              {isPublished ? 'Published (Live)' : 'Draft (Unpublished)'}
            </span>
          </label>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-crimson hover:bg-brand-crimson/90 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="animate-spin text-xs">⏳</span>}
            <span>Save &amp; Update Website</span>
          </button>
        </div>
      </form>
    </div>
  );
}
