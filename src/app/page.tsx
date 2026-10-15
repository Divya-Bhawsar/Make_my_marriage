export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-brand-sand p-8 md:p-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-sand text-brand-gold mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse" />
          Foundation Online
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-crimson mb-3">
          Make My Marriage
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 mb-8 font-medium">
          The operating system for managing an Indian wedding.
        </p>

        <div className="grid grid-cols-2 gap-3 text-left text-sm text-zinc-700 bg-brand-ivory/50 rounded-xl p-4 border border-brand-sand/60 mb-8">
          <div>
            <span className="font-semibold text-zinc-900">Architecture:</span> Modular Monolith
          </div>
          <div>
            <span className="font-semibold text-zinc-900">Tenancy:</span> Wedding Isolated
          </div>
          <div>
            <span className="font-semibold text-zinc-900">Runtime:</span> Next.js App Router
          </div>
          <div>
            <span className="font-semibold text-zinc-900">Database:</span> MongoDB + Mongoose
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/api/health"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-crimson text-white hover:bg-brand-crimson/90 transition-colors shadow-sm"
          >
            Check System Health
          </a>
        </div>
      </div>
    </main>
  );
}
