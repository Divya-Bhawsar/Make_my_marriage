import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { PlannerManager } from '@/components/ai-planner/planner-manager';
import { requireWeddingMember } from '@/server/auth/session';
import { AiPlannerService } from '@/modules/ai-planner/ai-planner.service';
import { GuestModel } from '@/modules/guest/guest.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import mongoose from 'mongoose';

export const metadata: Metadata = {
  title: 'AI Wedding Planner & Smart Assistant | Make My Marriage',
  description:
    'Intelligent Halwai ration calculations, regional cultural rituals, budget optimization, and strategic wedding advice.',
};

export const dynamic = 'force-dynamic';

export default async function PlannerPage() {
  let memberContext;
  try {
    memberContext = await requireWeddingMember();
  } catch {
    redirect('/login');
  }

  const { wedding, weddingId, user } = memberContext;
  const coupleTitle = wedding.title || `${wedding.brideName} & ${wedding.groomName}`;
  const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

  const [guestCount, totalCeremonies, culturalPresets] = await Promise.all([
    GuestModel.countDocuments({ weddingId: weddingObjectId }),
    WeddingEventModel.countDocuments({ weddingId: weddingObjectId, archivedAt: null }),
    AiPlannerService.getCulturalPresets(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav
        weddingTitle={coupleTitle}
        userName={user.name}
        weddingSlug={wedding.website?.slug}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PlannerManager
          culturalPresets={culturalPresets}
          guestCount={guestCount > 0 ? guestCount * 2 : 350} // scaled for family headcount
          totalCeremonies={totalCeremonies}
        />
      </main>
    </div>
  );
}
