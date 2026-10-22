import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { BroadcastManager } from '@/components/broadcasts/broadcast-manager';
import { requireWeddingMember } from '@/server/auth/session';
import { BroadcastService } from '@/modules/broadcast/broadcast.service';
import { WeddingEventModel } from '@/modules/event/event.model';
import { BROADCAST_TEMPLATES } from '@/modules/broadcast/broadcast.schema';
import mongoose from 'mongoose';

export const metadata: Metadata = {
  title: 'WhatsApp Broadcasts & Multi-Channel Reports | Make My Marriage',
  description:
    'Dispatch bulk personalized WhatsApp wedding invitations, RSVP reminders, and download CSV manifests for caterers and coordinators.',
};

export const dynamic = 'force-dynamic';

export default async function BroadcastsPage() {
  let memberContext;
  try {
    memberContext = await requireWeddingMember();
  } catch {
    redirect('/login');
  }

  const { wedding, weddingId, user } = memberContext;
  const coupleTitle = wedding.title || `${wedding.brideName} & ${wedding.groomName}`;

  const events = await WeddingEventModel.find({
    weddingId: new mongoose.Types.ObjectId(weddingId),
    archivedAt: null,
  }).sort({ startsAt: 1 });

  const ceremonyOptions = events.map((e) => ({
    id: e._id.toString(),
    name: e.name,
  }));

  const initialResult = await BroadcastService.getBroadcastRecipients(
    weddingId,
    {
      template: BROADCAST_TEMPLATES.RSVP_REMINDER,
      rsvpStatus: 'ALL',
      side: 'ALL',
    }
  );

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav
        weddingTitle={coupleTitle}
        userName={user.name}
        weddingSlug={wedding.website?.slug}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BroadcastManager
          initialResult={initialResult}
          ceremonies={ceremonyOptions}
          coupleTitle={coupleTitle}
        />
      </main>
    </div>
  );
}
