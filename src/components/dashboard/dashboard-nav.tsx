'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/landing/logo';

interface DashboardNavProps {
  weddingTitle?: string;
  userName?: string;
  weddingSlug?: string;
}

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: string;
  badge?: string;
  description?: string;
}

// 1. Primary Planning Essentials (Directly accessible in main bar)
const PRIMARY_NAV_LINKS: NavItem[] = [
  { href: '/app', label: 'Command Center', shortLabel: 'Overview', icon: '🏠', description: 'Overview & metrics' },
  { href: '/app/ceremonies', label: 'Ceremonies', icon: '🪔', description: 'Muhurats & schedules' },
  { href: '/app/guests', label: 'Guests & RSVPs', shortLabel: 'Guests', icon: '💌', description: 'Attendance & invites' },
  { href: '/app/expenses', label: 'Rupee Ledger', shortLabel: 'Budget', icon: '₹', description: 'Budget & payments' },
  { href: '/app/tasks', label: 'Tasks', icon: '📋', description: 'Checklist & timeline' },
  { href: '/app/vendors', label: 'Vendors', icon: '🤝', description: 'Bookings & contracts' },
];

// 2. Specialized Collaboration & Smart Tools (Inside clean "More Tools" dropdown)
const SECONDARY_NAV_LINKS: NavItem[] = [
  { href: '/app/gallery', label: 'Photo Vault', icon: '📸', description: 'QR tables & guest uploads' },
  { href: '/app/team', label: 'Team', icon: '👥', description: 'Committee roles & access' },
  { href: '/app/broadcasts', label: 'Broadcasts', icon: '📢', description: 'WhatsApp updates & blasts' },
  { href: '/app/planner', label: 'AI Planner', icon: '🤖', description: 'Halwai calculation & advice', badge: 'AI' },
  { href: '/app/website', label: 'Website', icon: '🌐', description: 'Theme & virtual live stream' },
];

export function DashboardNav({ weddingTitle, userName, weddingSlug }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  // Determine if active route is in secondary links
  const activeSecondary = SECONDARY_NAV_LINKS.find((item) =>
    pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
  );

  return (
    <header className="sticky top-0 z-40 border-b border-brand-sand/70 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand Logo & Wedding Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/app" className="flex items-center gap-2.5 group">
              <Logo size="sm" className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-sm sm:text-base tracking-tight text-brand-crimson leading-tight">
                  Make My Marriage
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold truncate max-w-[130px] sm:max-w-[200px]">
                  {weddingTitle || 'Command Center'}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Primary Navigation Bar (Clean, Grouped & Spacious) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-1 justify-center max-w-3xl">
            {PRIMARY_NAV_LINKS.map((link) => {
              const isActive =
                link.href === '/app'
                  ? pathname === '/app'
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-crimson text-white shadow-xs font-bold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                  }`}
                >
                  <span className="text-sm shrink-0">{link.icon}</span>
                  {link.shortLabel ? (
                    <>
                      <span className="hidden xl:inline">{link.label}</span>
                      <span className="xl:hidden">{link.shortLabel}</span>
                    </>
                  ) : (
                    <span>{link.label}</span>
                  )}
                </Link>
              );
            })}

            {/* "More Tools" Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`inline-flex items-center gap-1 lg:gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  activeSecondary
                    ? 'bg-brand-crimson/10 text-brand-crimson font-bold border border-brand-crimson/30'
                    : isMoreOpen
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80'
                }`}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
              >
                <span>{activeSecondary ? activeSecondary.icon : '✨'}</span>
                <span>{activeSecondary ? activeSecondary.label : 'More Tools'}</span>
                <span className={`text-[10px] transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Luxury Dropdown Popover */}
              {isMoreOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-brand-sand/80 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 mb-1 border-b border-zinc-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-serif">
                      Collaboration &amp; Smart Tools
                    </p>
                  </div>

                  <div className="space-y-1">
                    {SECONDARY_NAV_LINKS.map((item) => {
                      const isActive =
                        pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-start gap-3 p-2.5 rounded-xl text-xs transition-colors ${
                            isActive
                              ? 'bg-brand-crimson/10 text-brand-crimson font-bold'
                              : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
                          }`}
                        >
                          <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-zinc-900 text-xs">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 rounded-full bg-brand-crimson text-white text-[9px] font-bold">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[11px] text-zinc-500 font-normal truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Live Website Link Pill */}
            {weddingSlug && (
              <Link
                href={`/w/${weddingSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 transition-all shadow-2xs hover:shadow-xs group"
                title="View published wedding website"
              >
                <span className="text-sm">🌐</span>
                <span className="font-medium font-serif">Live Site</span>
                <span className="text-[10px] text-amber-700/70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                  ↗
                </span>
              </Link>
            )}

            {/* User Profile Info */}
            {userName && (
              <div className="hidden lg:flex items-center gap-2 pl-1 border-l border-zinc-200">
                <div className="h-8 w-8 rounded-xl bg-brand-crimson/10 border border-brand-crimson/20 text-brand-crimson font-bold text-xs flex items-center justify-center font-serif">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[110px]">
                    {userName}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">Wedding Admin</span>
                </div>
              </div>
            )}

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              Sign Out
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-center w-9 h-9"
              aria-label="Toggle navigation menu"
            >
              <span className="text-base font-bold leading-none">
                {isMobileMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Clean & Categorized) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white/98 backdrop-blur-md px-4 py-4 space-y-4 animate-in slide-in-from-top-3 duration-200 shadow-xl max-h-[85vh] overflow-y-auto">
          {/* Header Mobile Info */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <p className="text-xs font-bold text-zinc-900">{userName || 'Wedding Coordinator'}</p>
              <p className="text-[10px] text-zinc-500">{weddingTitle || 'Active Workspace'}</p>
            </div>
            {weddingSlug && (
              <Link
                href={`/w/${weddingSlug}`}
                target="_blank"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200"
              >
                <span>🌐</span>
                <span>Live Site ↗</span>
              </Link>
            )}
          </div>

          {/* Section 1: Core Planning */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-serif mb-2">
              Core Planning
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_NAV_LINKS.map((link) => {
                const isActive =
                  link.href === '/app'
                    ? pathname === '/app'
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-crimson text-white shadow-xs font-bold'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/60'
                    }`}
                  >
                    <span className="text-sm shrink-0">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section 2: Collaboration & Smart Tools */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-serif mb-2">
              Collaboration &amp; Smart Tools
            </p>
            <div className="space-y-1.5">
              {SECONDARY_NAV_LINKS.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                      isActive
                        ? 'bg-brand-crimson/10 text-brand-crimson font-bold border border-brand-crimson/30'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="font-semibold text-zinc-900 truncate">
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-brand-crimson text-white text-[9px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Sign Out */}
          <div className="pt-2 border-t border-zinc-100">
            <button
              onClick={handleLogout}
              className="w-full py-2.5 text-center text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
            >
              Sign Out from Workspace
            </button>
          </div>
        </div>
      )}

      {/* Mobile Quick Strip (When Drawer Closed): 4 Top Items + More Toggle */}
      {!isMobileMenuOpen && (
        <div className="md:hidden flex items-center justify-between px-3 py-1.5 border-t border-zinc-100 bg-zinc-50/70 text-xs">
          {PRIMARY_NAV_LINKS.slice(0, 4).map((link) => {
            const isActive =
              link.href === '/app'
                ? pathname === '/app'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 flex flex-col items-center py-1 rounded-lg transition-all ${
                  isActive
                    ? 'text-brand-crimson font-bold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span className="text-[10px] mt-0.5">{link.shortLabel || link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center py-1 text-zinc-500 hover:text-zinc-800 cursor-pointer"
          >
            <span className="text-sm">✨</span>
            <span className="text-[10px] mt-0.5">More...</span>
          </button>
        </div>
      )}
    </header>
  );
}
