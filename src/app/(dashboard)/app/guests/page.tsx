import React from 'react';
import type { Metadata } from 'next';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { GuestRoster } from '@/components/guests/guest-roster';

export const metadata: Metadata = {
  title: 'Guest List & Caterer Plates | Make My Marriage',
  description:
    'Manage your wedding guest roster, calculate caterer plate headcounts, and share 1-click WhatsApp RSVP invitations.',
};

export default function GuestsPage() {
  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GuestRoster />
      </main>
    </div>
  );
}
