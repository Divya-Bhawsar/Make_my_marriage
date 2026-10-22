import { FAQS } from './landing-data';

export function Faq() {
  return (
    <section id="faq" className="py-16 md:py-20 bg-brand-ivory/30 border-t border-brand-sand/60">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center rounded-full bg-brand-sand px-3 py-1 text-xs font-bold text-brand-gold uppercase tracking-wider">
            Quick Answers
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 font-serif">
            Common Questions
          </h2>
        </div>

        {/* 2x2 Grid for faster scanning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-brand-sand/80 bg-white p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <span className="rounded-md bg-brand-sand/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-gold inline-block mb-2">
                  {faq.category}
                </span>
                <h3 className="text-sm font-bold text-zinc-900 font-serif mb-2 flex items-start gap-2">
                  <span className="text-brand-crimson font-sans font-extrabold">Q.</span>
                  <span>{faq.question}</span>
                </h3>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed pl-5 mt-1">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
