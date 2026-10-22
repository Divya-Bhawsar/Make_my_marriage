import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { WebsiteManager } from '@/components/website/website-manager';

export const metadata: Metadata = {
  title: 'Wedding Website & Live Stream Settings | Make My Marriage',
  description:
    'Customize your wedding website design theme, configure YouTube live streaming, and publish your digital invitation.',
};

export default function WebsiteSettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WebsiteManager />
      </main>
    </div>
  );
}
