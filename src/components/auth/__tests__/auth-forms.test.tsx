import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { SignupForm } from '@/components/auth/signup-form';
import { LoginForm } from '@/components/auth/login-form';
import SignupPage from '@/app/(auth)/signup/page';
import LoginPage from '@/app/(auth)/login/page';

// Mock next/navigation useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function normalizeHtml(html: string): string {
  return html.replace(/<!-- -->/g, ' ').replace(/&amp;/g, '&');
}

describe('Authentication UI Components', () => {
  it('renders AuthCard with logo, title, subtitle, and home link', () => {
    const html = normalizeHtml(
      renderToString(
        <AuthCard title="Test Auth Title" subtitle="Test Auth Subtitle">
          <div id="test-child">Child Content</div>
        </AuthCard>
      )
    );
    expect(html).toContain('Make My Marriage');
    expect(html).toContain('Make My Marriage Emblem');
    expect(html).toContain('Test Auth Title');
    expect(html).toContain('Test Auth Subtitle');
    expect(html).toContain('Child Content');
    expect(html).toContain('href="/"');
    expect(html).toContain('Back to Make My Marriage Home');
  });

  it('renders SignupForm with full name, email, password inputs, and login link', () => {
    const html = normalizeHtml(renderToString(<SignupForm />));
    expect(html).toContain('Your Full Name');
    expect(html).toContain('id="name"');
    expect(html).toContain('Email Address');
    expect(html).toContain('id="email"');
    expect(html).toContain('Password');
    expect(html).toContain('id="password"');
    expect(html).toContain('Create Wedding Workspace');
    expect(html).toContain('href="/login"');
    expect(html).toContain('Sign In here');
  });

  it('renders LoginForm with email, password inputs, and signup link', () => {
    const html = normalizeHtml(renderToString(<LoginForm />));
    expect(html).toContain('Email Address');
    expect(html).toContain('id="login-email"');
    expect(html).toContain('Password');
    expect(html).toContain('id="login-password"');
    expect(html).toContain('Sign In to Wedding');
    expect(html).toContain('href="/signup"');
    expect(html).toContain('Create a workspace here');
  });

  it('renders SignupPage cleanly without throwing', () => {
    const html = normalizeHtml(renderToString(<SignupPage />));
    expect(html).toContain('Create Your Wedding Workspace');
    expect(html).toContain('Your Full Name');
    expect(html).toContain('Sign In here');
  });

  it('renders LoginPage cleanly without throwing', () => {
    const html = normalizeHtml(renderToString(<LoginPage />));
    expect(html).toContain('Sign In to Your Wedding');
    expect(html).toContain('Sign In to Wedding');
    expect(html).toContain('Create a workspace here');
  });
});
