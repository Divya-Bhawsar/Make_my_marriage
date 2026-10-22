import { BRAND_STACKING_TAGLINE, HOW_IT_WORKS_STEPS } from './landing-data';

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-gold uppercase tracking-wider">
            {BRAND_STACKING_TAGLINE}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 font-serif">
            3 Simple Steps to Wedding Calm
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-600">
            How families get organized from day one.
          </p>
        </div>

        {/* 3 Clean Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl bg-gradient-to-b from-brand-ivory/50 to-white p-7 shadow-2xs border border-brand-sand/70 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-crimson text-white font-mono font-bold text-base shadow-xs">
                    {step.number}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold bg-brand-sand/60 px-2 py-0.5 rounded-md">
                    {step.action}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 mb-1 font-serif">{step.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-2">
                  {step.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-brand-sand/50">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  {step.chipText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
