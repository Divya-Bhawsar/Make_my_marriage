import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { WeddingService } from '@/modules/wedding/wedding.service';
import { WeddingWebsiteView } from '@/components/website/wedding-website-view';
import { resolveSession } from '@/server/auth/session';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);

  try {
    const wedding = await WeddingService.getPublicWeddingBySlug(slug, {
      allowUnpublished: true,
    });

    const title = `${wedding.groomName} & ${wedding.brideName}'s Wedding | Make My Marriage`;
    const description = `Join ${wedding.groomName} & ${wedding.brideName} in celebrating their wedding festivities on ${wedding.weddingDate}.`;

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
      title: 'Wedding Website | Make My Marriage',
      description: 'Indian wedding celebration details, itinerary, and live streaming.',
    };
  }
}

export default async function PublicWeddingPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);

  const authContext = await resolveSession();
  const allowUnpublished = Boolean(
    authContext?.wedding && authContext.wedding.website.slug.toLowerCase() === slug.toLowerCase().trim()
  );

  try {
    const wedding = await WeddingService.getPublicWeddingBySlug(slug, {
      allowUnpublished,
    });

    const isPreview = !wedding.isPublished;

    return <WeddingWebsiteView wedding={wedding} isPreview={isPreview} />;
  } catch {
    notFound();
  }
}
