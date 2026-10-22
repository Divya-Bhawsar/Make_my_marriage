import React from 'react';
import type { Metadata } from 'next';
import { PublicMemberInvitationView } from '@/components/team/public-member-invitation-view';

export const metadata: Metadata = {
  title: 'Wedding Committee Invitation | Make My Marriage',
  description:
    'You have been invited to join the wedding planning committee. Accept your collaborator access.',
  robots: {
    index: false,
    follow: false,
  },
};

interface MemberInvitationPageProps {
  params: { token: string } | Promise<{ token: string }>;
}

export default async function MemberInvitationPage(props: MemberInvitationPageProps) {
  const { token } = await Promise.resolve(props.params);
  return <PublicMemberInvitationView token={token} />;
}
