import Link from 'next/link';
import { BRAND_TAGLINE, HERO_CONTENT } from './landing-data';
import { ThemePreview } from './theme-preview';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24 bg-gradient-to-b from-brand-ivory/60 via-white to-white">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-sand via-amber-200/50 to-brand-crimson/25 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headline, Snappy Subtitle, Actions */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Signature Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-sand bg-brand-ivory px-3.5 py-1 text-xs font-bold text-brand-gold shadow-2xs mb-5">
              <span className="flex h-2 w-2 rounded-full bg-brand-emerald animate-pulse" />
              <span>{BRAND_TAGLINE}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.12] font-serif">
              Your Wedding. Your People. Your Plan.{' '}
              <span className="text-brand-crimson underline decoration-brand-amber/60 decoration-wavy decoration-2">
                All in One Place.
              </span>
            </h1>

            {/* Crisp 1-sentence subtitle */}
            <p className="mt-5 text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {HERO_CONTENT.subheadline}
            </p>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
              <Link
                href={HERO_CONTENT.primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-brand-crimson px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-brand-crimson/25 hover:bg-brand-crimson/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {HERO_CONTENT.primaryCta.label}
              </Link>
              <a
                href={HERO_CONTENT.secondaryCta.href}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3.5 text-base font-semibold text-zinc-700 shadow-2xs hover:bg-brand-sand/30 hover:text-brand-crimson transition-all"
              >
                {HERO_CONTENT.secondaryCta.label}
              </a>
            </div>

            {/* 3 Visual Chips (Clean, zero essay) */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs font-semibold text-zinc-700 pt-6 border-t border-brand-sand/60">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ivory px-3 py-1 border border-brand-sand/80">
                <span className="text-brand-emerald">✓</span> Zero Guest Apps
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ivory px-3 py-1 border border-brand-sand/80">
                <span className="text-brand-emerald">✓</span> Two Families Synced
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ivory px-3 py-1 border border-brand-sand/80">
                <span className="text-brand-emerald">✓</span> Rupee Budget Ledger
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive Theme Preview */}
          <div className="lg:col-span-5">
            <ThemePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
