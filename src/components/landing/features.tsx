/* eslint-disable @next/next/no-img-element */
import { BRAND_TAGLINE, CORE_FEATURES, FeatureItem } from './landing-data';

function FeatureIcon({ name }: { name: FeatureItem['iconName'] }) {
  switch (name) {
    case 'calendar':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case 'mail':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case 'currency':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 8h6m-5 0a3 3 0 110 6H9l3 6m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case 'globe':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      );
    case 'camera':
      return (
        <svg className="w-5 h-5 text-brand-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
}

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24 bg-brand-ivory/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-gold uppercase tracking-wider">
            {BRAND_TAGLINE}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 font-serif">
            Built for Real Indian Weddings
          </h2>
          <p className="mt-2 text-sm sm:text-base text-zinc-600">
            Everything you need without the clutter. Designed for ease, speed, and family calm.
          </p>
        </div>

        {/* 6 Clean Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_FEATURES.map((feature) => (
            <div
              key={feature.id}
              className="group rounded-3xl border border-brand-sand/80 bg-white overflow-hidden shadow-2xs hover:shadow-xl hover:border-brand-gold/60 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo Banner if available */}
              {feature.photoUrl && (
                <div className="relative h-40 w-full overflow-hidden bg-zinc-100">
                  <img
                    src={feature.photoUrl}
                    alt={feature.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-2.5 left-3.5 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold text-brand-crimson shadow-2xs">
                    {feature.badge}
                  </span>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  {!feature.photoUrl && (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-sand/60">
                        <FeatureIcon name={feature.iconName} />
                      </div>
                      <span className="rounded-full bg-brand-ivory px-2 py-0.5 text-[10px] font-bold text-brand-gold border border-brand-sand">
                        {feature.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-brand-crimson transition-colors font-serif">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-zinc-600 leading-relaxed">
                    {feature.shortSnippet}
                  </p>

                  {/* Visual Data Chip */}
                  <div className="mt-3.5 rounded-xl bg-brand-ivory/60 px-3 py-1.5 text-[11px] font-semibold text-zinc-800 border border-brand-sand/60">
                    {feature.visualTag}
                  </div>
                </div>

                {/* 3 Short Bullet Points */}
                <div className="mt-5 pt-3.5 border-t border-zinc-100">
                  <ul className="space-y-1">
                    {feature.previewData.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-zinc-600">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
