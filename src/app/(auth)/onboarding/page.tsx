import React from 'react';
import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Wedding Setup & Onboarding | Make My Marriage',
  description:
    'Set up your royal Indian wedding workspace. Coordinate ceremonies, guest lists, caterer plates, and expenses all in one place.',
};

export default function OnboardingPage() {
  return (
    <AuthCard
      title="Create Your Wedding Workspace"
      subtitle="The central command center for your ceremonies, guest RSVPs, and celebrations."
    >
      <OnboardingWizard />
    </AuthCard>
  );
}
