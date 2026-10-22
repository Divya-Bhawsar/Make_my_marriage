import { COMPARISON_POINTS } from './landing-data';

export function Comparison() {
  return (
    <section id="the-reality" className="py-16 md:py-20 bg-white border-y border-brand-sand/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-gold uppercase tracking-wider">
            The Contrast
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 font-serif">
            WhatsApp Chaos vs. Make My Marriage
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-600">
            See how Make My Marriage replaces confusion with instant clarity.
          </p>
        </div>

        {/* 4 Clean Visual Row Cards */}
        <div className="space-y-4">
          {COMPARISON_POINTS.map((point) => (
            <div
              key={point.topic}
              className="grid grid-cols-1 md:grid-cols-12 rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs hover:shadow-sm transition-all"
            >
              {/* Category Title */}
              <div className="md:col-span-3 bg-zinc-50 p-4 flex items-center border-b md:border-b-0 md:border-r border-zinc-200">
                <span className="font-serif font-bold text-sm text-zinc-900">{point.topic}</span>
              </div>

              {/* The Chaotic Way */}
              <div className="md:col-span-4 bg-rose-50/50 p-4 flex items-center gap-3 border-b md:border-b-0 md:border-r border-zinc-200">
                <span className="h-6 w-6 shrink-0 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  ✕
                </span>
                <span className="text-xs sm:text-sm text-rose-950">{point.chaotic}</span>
              </div>

              {/* The Make My Marriage Way */}
              <div className="md:col-span-5 bg-emerald-50/50 p-4 flex items-center gap-3">
                <span className="h-6 w-6 shrink-0 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <span className="text-xs sm:text-sm font-semibold text-emerald-950">
                  {point.organized}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
