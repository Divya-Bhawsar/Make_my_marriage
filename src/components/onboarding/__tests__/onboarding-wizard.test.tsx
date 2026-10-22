import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import OnboardingPage from '@/app/(auth)/onboarding/page';
import DashboardPage from '@/app/(dashboard)/app/page';

// Mock next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Onboarding UI Flow', () => {
  it('renders OnboardingWizard step 1 with groom and bride input fields', () => {
    const html = normalizeHtml(renderToString(<OnboardingWizard />));
    expect(html).toContain('The Couple');
    expect(html).toContain('Who is getting married?');
    expect(html).toContain("Groom's Name");
    expect(html).toContain('id="groomName"');
    expect(html).toContain("Bride's Name");
    expect(html).toContain('id="brideName"');
    expect(html).toContain('Next: Date & Venue');
  });

  it('renders OnboardingPage with luxury royal AuthCard', () => {
    const html = normalizeHtml(renderToString(<OnboardingPage />));
    expect(html).toContain('Make My Marriage');
    expect(html).toContain('Create Your Wedding Workspace');
    expect(html).toContain('The central command center for your ceremonies');
    expect(html).toContain('Who is getting married?');
  });

  it('renders DashboardPage shell without throwing', () => {
    const html = normalizeHtml(renderToString(<DashboardPage />));
    expect(html).toContain('Opening your wedding command center');
  });
});
