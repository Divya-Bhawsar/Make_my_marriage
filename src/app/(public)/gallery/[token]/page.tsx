import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PhotoService } from '@/modules/photo/photo.service';
import { PublicGalleryView } from '@/components/gallery/public-gallery-view';
import { ForbiddenError } from '@/shared/errors/app-error';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { token: string } | Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await Promise.resolve(params);

  try {
    const gallery = await PhotoService.getPublicGalleryByToken(token);

    const title = `${gallery.groomName} & ${gallery.brideName}'s Wedding Photo Album | Make My Marriage`;
    const description = `View and contribute candid photos to ${gallery.groomName} & ${gallery.brideName}'s sacred wedding celebration.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
    };
  } catch {
    return {
      title: 'Wedding Photo Vault | Make My Marriage',
      description: 'Shared private wedding memories and guest photo vault.',
    };
  }
}

export default async function PublicGalleryPage({ params }: PageProps) {
  const { token } = await Promise.resolve(params);

  try {
    const gallery = await PhotoService.getPublicGalleryByToken(token);

    return <PublicGalleryView gallery={gallery} token={token} />;
  } catch (err: any) {
    const isForbidden =
      err instanceof ForbiddenError || err?.status === 403 || err?.statusCode === 403;

    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-amber-50/30 to-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card/90 backdrop-blur-md rounded-2xl border border-border/80 shadow-xl p-8 text-center space-y-5 animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            {isForbidden ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3m3-3h6l2 3h4a2 2 0 012 2v9.34m-7.72-2.06a4 4 0 11-5.56-5.56" />
              </svg>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold font-serif text-foreground">
              {isForbidden ? 'Photo Vault is Private' : 'Gallery Link Expired or Not Found'}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isForbidden
                ? 'The couple has temporarily set their wedding photo vault to private mode. Please check back later or ask the hosts for access.'
                : 'We couldn’t find an active album for this QR code or link. If you scanned a table QR standee, the hosts may have refreshed the code.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-sm font-medium transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Return Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition"
            >
              Sign In as Host
            </Link>
          </div>

          <p className="text-xs text-muted-foreground/80 pt-2 border-t border-border/40">
            Make My Marriage &bull; Sacred Weddings & Private Albums
          </p>
        </div>
      </div>
    );
  }
}

