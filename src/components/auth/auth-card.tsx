import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/landing/logo';
import { BRAND_STACKING_TAGLINE } from '@/components/landing/landing-data';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-brand-ivory/60 via-white to-brand-sand/20">
      {/* Background radial accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-brand-sand via-amber-200/40 to-brand-crimson/15 opacity-60 sm:left-[calc(50%-20rem)] sm:w-[60rem]"
        />
      </div>

      {/* Top Header with Bespoke Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link href="/" className="inline-flex flex-col items-center gap-2 group mb-4">
          <Logo size="lg" className="group-hover:scale-105 transition-transform" />
          <span className="font-serif font-extrabold text-2xl tracking-tight text-brand-crimson">
            Make My Marriage
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
            {BRAND_STACKING_TAGLINE}
          </span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 font-serif">
          {title}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Card Body */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="rounded-3xl border border-brand-sand/80 bg-white/95 p-6 sm:p-10 shadow-xl backdrop-blur-md">
          {children}
        </div>

        {/* Back to Home & Trust Reassurance */}
        <div className="mt-6 text-center text-xs text-zinc-500 space-y-2">
          <p className="flex items-center justify-center gap-1.5 font-medium text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald" />
            <span>Bank-grade encryption • No spam • Private for your family</span>
          </p>
          <div>
            <Link
              href="/"
              className="text-zinc-500 hover:text-brand-crimson transition-colors font-medium inline-flex items-center gap-1"
            >
              <span>&larr;</span> Back to Make My Marriage Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
