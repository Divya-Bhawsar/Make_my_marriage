import React from 'react';
import type { Metadata } from 'next';
import { PublicInviteCard } from '@/components/invite/public-invite-card';

export const metadata: Metadata = {
  title: 'Wedding Invitation & RSVP | Make My Marriage',
  description:
    'You are cordially invited to celebrate our wedding festivities. View the ceremony schedule and confirm your attendance.',
  robots: {
    index: false,
    follow: false,
  },
};

interface InvitePageProps {
  params: { token: string } | Promise<{ token: string }>;
}

export default async function InvitePage(props: InvitePageProps) {
  const { token } = await Promise.resolve(props.params);
  return <PublicInviteCard token={token} />;
}
