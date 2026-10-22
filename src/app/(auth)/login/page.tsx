import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Log In — Make My Marriage',
  description: 'Sign in to your Make My Marriage wedding workspace. Manage ceremonies, guests, and family tasks.',
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Sign In to Your Wedding"
      subtitle="Welcome back. Access your ceremony schedules, rupee ledger, and guest lists."
    >
      <LoginForm />
    </AuthCard>
  );
}
