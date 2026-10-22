'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardNav } from './dashboard-nav';
import { formatCompactRupees } from '@/shared/utils/currency';

interface WeddingData {
  id: string;
  brideName: string;
  groomName: string;
  title?: string | null;
  weddingDate: string;
  timeZone: string;
  location?: {
    city?: string | null;
    formattedAddress?: string | null;
  };
  website: {
    slug: string;
    theme?: string;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface DashboardMetrics {
  guestTotal: number;
  confirmedPlates: number;
  pendingRsvp: number;
  totalAgreedPaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
  totalTasks: number;
  completedTasks: number;
  tasksPercentage: number;
  ceremoniesCount: number;
  photosCount: number;
}

export function DashboardShell() {
  const router = useRouter();
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    guestTotal: 0,
    confirmedPlates: 0,
    pendingRsvp: 0,
    totalAgreedPaise: 0,
    totalPaidPaise: 0,
    totalPendingPaise: 0,
    totalTasks: 0,
    completedTasks: 0,
    tasksPercentage: 0,
    ceremoniesCount: 0,
    photosCount: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to load wedding details');
        }
        const sessionData = await response.json();
        if (!sessionData.data.wedding) {
          router.push('/onboarding');
          return;
        }

        setUser(sessionData.data.user);
        setWedding(sessionData.data.wedding);

        // Fetch live metrics concurrently with graceful fallbacks
        const [expensesRes, guestsRes, tasksRes, eventsRes, photosRes] =
          await Promise.allSettled([
            fetch('/api/expenses/summary').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/guests/plate-summary').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/tasks/summary').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/events').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/photos?limit=1').then((r) => (r.ok ? r.json() : null)),
          ]);

        const expensesData =
          expensesRes.status === 'fulfilled' ? expensesRes.value?.data : null;
        const guestsData =
          guestsRes.status === 'fulfilled' ? guestsRes.value?.data : null;
        const tasksData =
          tasksRes.status === 'fulfilled' ? tasksRes.value?.data : null;
        const eventsData =
          eventsRes.status === 'fulfilled' ? eventsRes.value?.data : null;
        const photosData =
          photosRes.status === 'fulfilled' ? photosRes.value?.data : null;

        setMetrics({
          guestTotal: guestsData?.totalGuestsCount || 0,
          confirmedPlates: guestsData?.confirmedAttendingPlates || 0,
          pendingRsvp: guestsData?.pendingCount || 0,
          totalAgreedPaise: expensesData?.totalAgreedPaise || 0,
          totalPaidPaise: expensesData?.totalPaidPaise || 0,
          totalPendingPaise: expensesData?.totalPendingPaise || 0,
          totalTasks: tasksData?.totalTasks || 0,
          completedTasks: tasksData?.completedTasks || 0,
          tasksPercentage: tasksData?.completionPercentage || 0,
          ceremoniesCount: Array.isArray(eventsData?.events)
            ? eventsData.events.length
            : Array.isArray(eventsData)
            ? eventsData.length
            : 0,
          photosCount: photosData?.metrics?.totalCount || 0,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to connect to workspace';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [router]);

  // Calculate days to wedding
  const daysToGo = React.useMemo(() => {
    if (!wedding?.weddingDate) return null;
    const target = new Date(wedding.weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [wedding?.weddingDate]);

  // Formatted wedding date string
  const formattedWeddingDate = React.useMemo(() => {
    if (!wedding?.weddingDate) return '';
    try {
      return new Date(wedding.weddingDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return wedding.weddingDate;
    }
  }, [wedding?.weddingDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50/50 via-white to-stone-50">
        <div className="text-center space-y-3">
          <div className="inline-block h-9 w-9 animate-spin rounded-full border-3 border-amber-800 border-t-transparent shadow-sm" />
          <p className="text-sm font-semibold text-amber-950 font-serif">
            Opening your wedding command center...
          </p>
        </div>
      </div>
    );
  }

  if (error || !wedding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-stone-50">
        <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-lg space-y-4">
          <div className="text-3xl">⚠️</div>
          <p className="text-sm text-rose-800 font-medium">{error || 'Workspace not found'}</p>
          <button
            onClick={() => router.push('/onboarding')}
            className="rounded-xl bg-amber-800 hover:bg-amber-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    );
  }

  const coupleHeading = `${wedding.groomName} & ${wedding.brideName}`;
  const budgetSpentPercent =
    metrics.totalAgreedPaise > 0
      ? Math.min(100, Math.round((metrics.totalPaidPaise / metrics.totalAgreedPaise) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/40 via-stone-50/60 to-orange-50/20 flex flex-col text-stone-900 antialiased">
      {/* Top Royal Navbar */}
      <DashboardNav
        weddingTitle={wedding.title || `${wedding.groomName} & ${wedding.brideName}`}
        userName={user?.name}
        weddingSlug={wedding.website.slug}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ================================================================= */}
        {/* HERO BANNER: Royal Crimson & Golden Shloka                        */}
        {/* ================================================================= */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-600/40 bg-gradient-to-br from-[#881337] via-[#70102b] to-[#4c0519] p-6 sm:p-10 text-white shadow-xl">
          {/* Subtle Royal Floral Insignia Accents */}
          <div className="absolute top-3 right-4 text-amber-300/15 text-6xl font-serif select-none pointer-events-none">
            ⚜️
          </div>
          <div className="absolute -bottom-6 -left-6 text-amber-300/10 text-9xl font-serif select-none pointer-events-none">
            🪔
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-300/30 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-xs">
                <span>॥ श्री गणेशाय नमः ॥</span>
                <span>•</span>
                <span>Royal Wedding Command Center</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif tracking-tight text-amber-100 drop-shadow-xs">
                {coupleHeading}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-amber-200/90 font-medium">
                <span className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg">
                  📍 {wedding.location?.city || wedding.location?.formattedAddress || 'India'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg">
                  📅 {formattedWeddingDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-lg">
                  ✨ {metrics.ceremoniesCount} Sacred Ceremonies
                </span>
              </div>

              {/* Quick Hero Shortcuts */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <Link
                  href={`/w/${wedding.website.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 text-xs font-bold transition shadow-xs"
                >
                  <span>🌐</span>
                  <span>View Public Website ↗</span>
                </Link>
                <Link
                  href="/app/gallery"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 text-xs font-bold transition shadow-xs"
                >
                  <span>📸</span>
                  <span>Table QR Standee</span>
                </Link>
                <Link
                  href="/app/team"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-amber-100 text-xs font-bold transition shadow-xs"
                >
                  <span>👥</span>
                  <span>Invite Collaborators</span>
                </Link>
              </div>
            </div>

            {/* Glowing Royal Countdown Widget */}
            <div className="shrink-0 rounded-3xl bg-black/30 p-6 sm:p-7 backdrop-blur-md border border-amber-400/40 text-center min-w-[160px] shadow-lg flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200">
                Wedding Countdown
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold text-amber-300 font-serif my-1 drop-shadow-md">
                {daysToGo ?? '—'}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100/90">
                {daysToGo === 1 ? 'Day to go' : 'Days to go'}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 4 LIVE PULSE CARDS: Real-Time High-Impact Planning Gauges        */}
        {/* ================================================================= */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-serif font-extrabold text-stone-900 flex items-center gap-2">
              <span>📊</span>
              <span>Wedding Vitals &amp; Progress</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Real-time sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Guests & Caterer Plates */}
            <Link
              href="/app/guests"
              className="group rounded-2xl bg-white border border-stone-200/80 p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    💌 RSVP Tracker
                  </span>
                  <span className="text-xl">👥</span>
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-stone-900">
                    {metrics.confirmedPlates}
                    <span className="text-sm font-normal text-stone-500 ml-1">
                      / {metrics.guestTotal} Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {metrics.pendingRsvp > 0
                      ? `${metrics.pendingRsvp} families awaiting RSVP response`
                      : 'All invited guests have confirmed!'}
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Manage Guests</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Card 2: Rupee Expense Ledger */}
            <Link
              href="/app/expenses"
              className="group rounded-2xl bg-white border border-stone-200/80 p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                    ₹ Expense Ledger
                  </span>
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-stone-900">
                    {formatCompactRupees(metrics.totalPaidPaise)}
                    <span className="text-xs font-normal text-stone-500 ml-1">
                      of {formatCompactRupees(metrics.totalAgreedPaise)}
                    </span>
                  </div>
                  {/* Spending Progress Bar */}
                  <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-rose-700 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${budgetSpentPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5 flex justify-between">
                    <span>{budgetSpentPercent}% Paid Out</span>
                    <span>Pending: {formatCompactRupees(metrics.totalPendingPaise)}</span>
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Open Ledger</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Card 3: Tasks & Checklist */}
            <Link
              href="/app/tasks"
              className="group rounded-2xl bg-white border border-stone-200/80 p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                    📋 Checklist Progress
                  </span>
                  <span className="text-xl">✅</span>
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-stone-900">
                    {metrics.completedTasks}
                    <span className="text-sm font-normal text-stone-500 ml-1">
                      / {metrics.totalTasks} Done
                    </span>
                  </div>
                  {/* Task Progress Bar */}
                  <div className="w-full bg-stone-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.tasksPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    {metrics.tasksPercentage}% completed across family committees
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>View Checklist</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* Card 4: Photo Vault & Moments */}
            <Link
              href="/app/gallery"
              className="group rounded-2xl bg-white border border-stone-200/80 p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                    📸 Guest Moments
                  </span>
                  <span className="text-xl">✨</span>
                </div>
                <div>
                  <div className="text-2xl font-bold font-serif text-stone-900">
                    {metrics.photosCount}
                    <span className="text-sm font-normal text-stone-500 ml-1">
                      Photos Shared
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Candid memories captured from dinner table QR standees.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-stone-100 mt-4 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Generate QR Standee</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SMART NEXT STEPS / PLANNING ASSISTANT                            */}
        {/* ================================================================= */}
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-yellow-50/50 to-orange-50/60 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center text-lg shrink-0 shadow-xs">
                💡
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-serif text-amber-950">
                  Smart Planning Recommendation
                </h3>
                <p className="text-xs text-amber-900/80 leading-relaxed max-w-2xl">
                  {metrics.pendingRsvp > 0
                    ? `You have ${metrics.pendingRsvp} invited families pending RSVP. Use 1-tap WhatsApp invitations to nudge guests before finalizing caterer plate orders!`
                    : metrics.totalTasks === 0
                    ? 'Your checklist is empty! Populate Indian wedding ceremony tasks (Haldi, Mehendi, Pandit samagri, Caterer tokens) to coordinate duties.'
                    : 'Calculate exact halwai sweet & snack quantities using the AI Wedding Planner to avoid caterer plate wastage!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {metrics.pendingRsvp > 0 ? (
                <Link
                  href="/app/broadcasts"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Send WhatsApp Blasts 📢
                </Link>
              ) : (
                <Link
                  href="/app/planner"
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Open AI Halwai Calculator 🍲
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 1: CORE WEDDING PLANNING ESSENTIALS                       */}
        {/* ================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-extrabold text-stone-900 flex items-center gap-2">
              <span>🏛️</span>
              <span>Core Wedding Execution</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Essential planning tools</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* 1. Ceremonies & Muhurat Itinerary */}
            <Link
              href="/app/ceremonies"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    🪔
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                    {metrics.ceremoniesCount} Events
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  Ceremonies &amp; Itinerary
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Schedule Haldi, Mehendi, Sangeet, Pheras, and Reception with Pandit muhurat timings and venue maps.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Manage Schedule</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 2. Guests & Caterer Plates */}
            <Link
              href="/app/guests"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    💌
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    {metrics.confirmedPlates} Confirmed
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  Guests &amp; Caterer Plates
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Track family guest rosters, dietary preferences (Jain, Pure Veg), and 1-tap WhatsApp attendance invitations.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Manage Guests &amp; RSVPs</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 3. Rupee Expense Ledger */}
            <Link
              href="/app/expenses"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    ₹
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/60">
                    {formatCompactRupees(metrics.totalAgreedPaise)} Budget
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  Rupee Expense Ledger
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Track halwai tokens, venue advances, jewelry expenses, and multi-family budget split balances.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Open Financial Ledger</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 4. Tasks & Committee Checklists */}
            <Link
              href="/app/tasks"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60">
                    {metrics.tasksPercentage}% Done
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  Tasks &amp; Checklist
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Phase-wise Indian wedding checklist with duty assignments across hospitality, rituals, and logistics squads.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>View Task Checklist</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 5. Vendor Notebook */}
            <Link
              href="/app/vendors"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    🤝
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200/60">
                    Directory
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  Vendor Directory &amp; Bookings
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Manage booked caterers, decorators, mehendi artists, photographers, and track contract terms &amp; contacts.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Explore Vendors</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 6. AI Wedding Planner & Halwai Calculator */}
            <Link
              href="/app/planner"
              className="group rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xs hover:border-amber-500/60 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200/60">
                    Smart AI
                  </span>
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-lg group-hover:text-amber-800 transition-colors">
                  AI Planner &amp; Halwai Calculator
                </h3>
                <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                  Calculate exact halwai sweet and snack ration batches, simulate plate buffer recommendations, and get regional advice.
                </p>
              </div>
              <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Calculate Catering</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 2: DIGITAL EXPERIENCES & COLLABORATIONS                   */}
        {/* ================================================================= */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-extrabold text-stone-900 flex items-center gap-2">
              <span>✨</span>
              <span>Digital Experiences &amp; Guest Collaboration</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Guest engagement &amp; team access</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 7. Private Photo Vault & Table QR */}
            <Link
              href="/app/gallery"
              className="group rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-500/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  📸
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-800 transition-colors">
                  Table QR &amp; Photo Vault
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Generate banquet table standees for guests to upload candid moments instantly.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Open Vault</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 8. Themed Wedding Website & Livestream */}
            <Link
              href="/app/website"
              className="group rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-500/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  🌐
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-800 transition-colors">
                  Wedding Website &amp; Live
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Customize themes, publish your digital invite story, and embed YouTube live streaming.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Manage Website</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 9. Committee Collaborators & Roles */}
            <Link
              href="/app/team"
              className="group rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-500/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  👥
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-800 transition-colors">
                  Wedding Committee &amp; Team
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Invite family coordinators, assign Admin or Manager roles with WhatsApp invite links.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Manage Team</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>

            {/* 10. WhatsApp Broadcasts & Catering Reports */}
            <Link
              href="/app/broadcasts"
              className="group rounded-3xl border border-stone-200/90 bg-white p-5 shadow-xs hover:border-amber-500/60 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform">
                  📢
                </div>
                <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-amber-800 transition-colors">
                  WhatsApp Broadcasts
                </h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  1-tap WhatsApp invitations, ceremony updates, and catering manifest Excel exports.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-800">
                <span>Open Broadcasts</span>
                <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
