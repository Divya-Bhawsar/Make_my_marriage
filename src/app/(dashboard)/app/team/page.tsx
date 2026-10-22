import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { TeamManager } from '@/components/team/team-manager';
import { requireWeddingMember } from '@/server/auth/session';
import { MemberService } from '@/modules/member/member.service';
import { USER_ROLES } from '@/shared/constants';

export const metadata: Metadata = {
  title: 'Wedding Committee & Role-Based Permissions | Make My Marriage',
  description:
    'Collaborate with family coordinators, bridesmaids, groomsmen, and planners with role-based permissions.',
};

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  let memberContext;
  try {
    memberContext = await requireWeddingMember();
  } catch {
    redirect('/login');
  }

  const { wedding, weddingId, user, role } = memberContext;

  const headersList = await headers();
  const forwardedHost = headersList.get('x-forwarded-host');
  const forwardedProto = headersList.get('x-forwarded-proto') || 'https';
  const host = forwardedHost || headersList.get('host') || 'localhost:3000';
  const proto = forwardedHost ? forwardedProto : (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const baseUrl = `${proto}://${host}`;

  const members = await MemberService.listMembers(weddingId);
  const invitations =
    role === USER_ROLES.ADMIN ? await MemberService.listInvitations(weddingId, baseUrl) : [];

  return (
    <div className="min-h-screen bg-zinc-50/70 flex flex-col">
      <DashboardNav
        weddingTitle={wedding.title || `${wedding.brideName} & ${wedding.groomName}`}
        userName={user.name}
        weddingSlug={wedding.website?.slug}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamManager
          initialMembers={members}
          initialInvitations={invitations}
          currentUserId={user.id}
          currentUserRole={role}
          weddingTitle={wedding.title || `${wedding.brideName} & ${wedding.groomName}`}
        />
      </main>
    </div>
  );
}
