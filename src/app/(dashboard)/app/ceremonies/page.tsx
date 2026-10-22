import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { CeremonyList } from '@/components/ceremonies/ceremony-list';

export const metadata: Metadata = {
  title: 'Ceremonies & Itinerary | Make My Marriage',
  description:
    'Plan and organize your multi-day Indian wedding schedule including Haldi, Mehendi, Sangeet, Pheras, and Reception.',
};

export default function CeremoniesPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CeremonyList />
      </main>
    </div>
  );
}
