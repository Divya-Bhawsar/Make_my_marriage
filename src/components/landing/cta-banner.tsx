import Link from 'next/link';
import { BRAND_TAGLINE } from './landing-data';

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-br from-brand-crimson via-rose-950 to-brand-crimson text-white shadow-2xl">
      {/* Background ambient lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 opacity-15 bg-[radial-gradient(#fef3c7_1px,transparent_1px)] [background-size:20px_20px]"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-brand-sand backdrop-blur-xs mb-6 border border-white/20 uppercase tracking-wider">
          {BRAND_TAGLINE}
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif leading-tight">
          Bring Calm & Joy Back to Your Wedding Celebration
        </h2>

        <p className="mt-5 text-base sm:text-lg text-brand-sand/90 max-w-2xl mx-auto leading-relaxed">
          No more misplaced numbers, conflicting itineraries, or spreadsheet stress. Give both families a single, dignified workspace they will actually love using.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-brand-crimson shadow-2xl hover:bg-brand-sand transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Your Wedding Workspace
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur-xs px-6 py-4 text-base font-semibold text-white hover:bg-white/20 transition-all"
          >
            Sign In to Existing Wedding
          </Link>
        </div>
      </div>
    </section>
  );
}
