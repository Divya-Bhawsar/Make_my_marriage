import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up — Make My Marriage',
  description: 'Create your wedding workspace on Make My Marriage. The operating system for managing an Indian wedding.',
};

export default function SignupPage() {
  return (
    <AuthCard
      title="Create Your Wedding Workspace"
      subtitle="Bring both families, all ceremonies, and your budget into one calm, shared place."
    >
      <SignupForm />
    </AuthCard>
  );
}
