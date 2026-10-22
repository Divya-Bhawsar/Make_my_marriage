import React from 'react';
import type { Metadata } from 'next';
import { GalleryManager } from '@/components/gallery/gallery-manager';

export const metadata: Metadata = {
  title: 'Private Photo Vault & Table QR | Make My Marriage',
  description: 'Collect candid high-res wedding photos from guests, organize ceremony albums, and print dinner table QR standees.',
};

export const dynamic = 'force-dynamic';

export default function GalleryPage() {
  return <GalleryManager />;
}
