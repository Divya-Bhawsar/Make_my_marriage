import Link from 'next/link';
import { Logo } from './logo';
import { BRAND_STACKING_TAGLINE, BRAND_TAGLINE } from './landing-data';

export function Footer() {
  return (
    <footer className="border-t border-brand-sand/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info & Stacking Tagline */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo size="md" className="group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="font-serif font-extrabold text-lg text-brand-crimson leading-tight">
                  Make My Marriage
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
                  {BRAND_STACKING_TAGLINE}
                </span>
              </div>
            </Link>

            <p className="mt-4 text-sm text-zinc-600 max-w-sm leading-relaxed">
              {BRAND_TAGLINE}. Bringing couples, parents, relatives, and memories together under one calm roof.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="/api/health"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-ivory px-3 py-1 text-xs font-semibold text-brand-gold border border-brand-sand hover:bg-brand-sand/50 transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-brand-emerald animate-pulse" />
                <span>System Status Online</span>
              </a>
            </div>
          </div>

          {/* Quick Links: Ceremonies & Logistics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Ceremonies & Planning
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Multi-Ceremony Timeline
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Two Families Co-Management
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Accountless Guest RSVPs
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Rupee Expense Ledger
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links: Guest Experience */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
              Guest Experience
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Themed Wedding Website
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  YouTube Livestream for Overseas
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-brand-crimson transition-colors">
                  Table QR Photo Drop
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-brand-crimson transition-colors font-semibold text-brand-crimson">
                  Member Sign In &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Make My Marriage. All rights reserved.</p>
          <p className="text-zinc-400">{BRAND_STACKING_TAGLINE} for families worldwide.</p>
        </div>
      </div>
    </footer>
  );
}
