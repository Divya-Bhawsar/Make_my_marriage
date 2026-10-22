import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { DashboardNav } from '../dashboard-nav';
import { DashboardShell } from '../dashboard-shell';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app',
}));

describe('Dashboard Components (Royal Heritage Redesign)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DashboardNav', () => {
    it('renders navigation with wedding title, primary links, and live site link', () => {
      const html = renderToString(
        <DashboardNav
          weddingTitle="Eisha & Vivek's Grand Wedding"
          userName="Vivek Sharma"
          weddingSlug="eisha-vivek-20102026"
        />
      );

      // Branding & Title
      expect(html).toContain('Make My Marriage');
      expect(html).toContain("Eisha &amp; Vivek&#x27;s Grand Wedding");

      // Primary Navigation Links
      expect(html).toContain('Command Center');
      expect(html).toContain('Ceremonies');
      expect(html).toContain('Guests &amp; RSVPs');
      expect(html).toContain('Rupee Ledger');
      expect(html).toContain('Tasks');
      expect(html).toContain('Vendors');

      // More Tools & Live Site
      expect(html).toContain('More Tools');
      expect(html).toContain('Live Site');
      expect(html).toContain('/w/eisha-vivek-20102026');
    });

    it('renders cleanly when optional props are omitted', () => {
      const html = renderToString(<DashboardNav />);
      expect(html).toContain('Command Center');
      expect(html).not.toContain('Live Site');
    });
  });

  describe('DashboardShell (Server-side rendering & initial layout)', () => {
    it('renders loading spinner state gracefully before session resolves', () => {
      // Stub global fetch to prevent unhandled rejection during SSR
      vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));

      const html = renderToString(<DashboardShell />);
      expect(html).toContain('Opening your wedding command center');
    });
  });
});
