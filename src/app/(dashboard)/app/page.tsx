import React from 'react';
import type { Metadata } from 'next';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const metadata: Metadata = {
  title: 'Wedding Command Center | Make My Marriage',
  description:
    'Manage your ceremonies, guests, RSVP responses, expenses, and wedding website in one royal dashboard.',
};

export default function DashboardPage() {
  return <DashboardShell />;
}
