import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { VendorNotebook } from '@/components/vendors/vendor-notebook';

export const metadata: Metadata = {
  title: 'Vendor Notebook & Nearby Discovery | Make My Marriage',
  description:
    'Manage booked wedding vendors, contract values, phone contacts, ceremony assignments, and discover top-rated local wedding professionals.',
};

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <VendorNotebook />
      </main>
    </div>
  );
}
