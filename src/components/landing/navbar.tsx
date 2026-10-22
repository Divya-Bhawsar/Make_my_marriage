import Link from 'next/link';
import { Logo } from './logo';
import { BRAND_STACKING_TAGLINE, NAV_LINKS } from './landing-data';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-sand/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with Bespoke Indian Wedding Crest & Stacking Tagline */}
        <Link href="/" className="flex items-center gap-3 group">
          <Logo size="md" className="group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-serif font-extrabold text-lg sm:text-xl tracking-tight text-brand-crimson leading-tight">
              Make My Marriage
            </span>
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
              {BRAND_STACKING_TAGLINE}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-600">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-brand-crimson transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:text-brand-crimson hover:bg-brand-sand/30 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-brand-crimson px-4 sm:px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-crimson/25 hover:bg-brand-crimson/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start Planning
          </Link>
        </div>
      </div>
    </header>
  );
}
