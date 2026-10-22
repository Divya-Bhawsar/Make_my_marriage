import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { CeremonyCard } from '@/components/ceremonies/ceremony-card';
import { CeremonyModal } from '@/components/ceremonies/ceremony-modal';
import { CeremonyList } from '@/components/ceremonies/ceremony-list';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import CeremoniesPage from '@/app/(dashboard)/app/ceremonies/page';
import { WeddingEventDTO } from '@/modules/event/event.service';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/ceremonies',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Ceremonies UI Components', () => {
  const mockEvent: WeddingEventDTO = {
    id: 'e1',
    weddingId: 'w1',
    name: 'Haldi Ceremony',
    type: 'HALDI',
    startsAt: '2026-10-19T10:00:00.000Z',
    endsAt: '2026-10-19T13:00:00.000Z',
    venueName: 'Sayaji Hotel Courtyard',
    address: 'Indore, MP',
    dressCode: 'Shades of Yellow',
    description: 'Auspicious haldi rituals followed by lunch',
    archivedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('renders CeremonyCard with type badge, timings, venue, dress code, and action buttons', () => {
    const html = normalizeHtml(
      renderToString(
        <CeremonyCard
          event={mockEvent}
          onEdit={vi.fn()}
          onArchive={vi.fn()}
        />
      )
    );

    expect(html).toContain('Haldi Ceremony');
    expect(html).toContain('Haldi');
    expect(html).toContain('Sayaji Hotel Courtyard');
    expect(html).toContain('Indore, MP');
    expect(html).toContain('Shades of Yellow');
    expect(html).toContain('Map');
    expect(html).toContain('Edit');
    expect(html).toContain('Archive');
  });

  it('renders CeremonyModal with quick presets and form inputs when open', () => {
    const html = normalizeHtml(
      renderToString(
        <CeremonyModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      )
    );

    expect(html).toContain('Add New Ceremony');
    expect(html).toContain('Quick Ceremony Presets:');
    expect(html).toContain('Haldi');
    expect(html).toContain('Mehendi');
    expect(html).toContain('Sangeet');
    expect(html).toContain('id="eventName"');
    expect(html).toContain('id="eventType"');
    expect(html).toContain('id="eventDate"');
    expect(html).toContain('id="startTime"');
  });

  it('does not render CeremonyModal when isOpen is false', () => {
    const html = renderToString(
      <CeremonyModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders CeremonyList with header and Add Ceremony button', () => {
    const html = normalizeHtml(renderToString(<CeremonyList />));
    expect(html).toContain('Ceremonies & Itinerary');
    expect(html).toContain('Add Ceremony');
  });

  it('renders DashboardNav with navigation links and wedding title', () => {
    const html = normalizeHtml(
      renderToString(
        <DashboardNav
          weddingTitle="Vivek & Eisha"
          userName="Divya"
          weddingSlug="eisha-vivek-20102026"
        />
      )
    );

    expect(html).toContain('Make My Marriage');
    expect(html).toContain('Vivek & Eisha');
    expect(html).toContain('Command Center');
    expect(html).toContain('Ceremonies');
    expect(html).toContain('Divya');
    expect(html).toContain('Sign Out');
  });

  it('renders CeremoniesPage route component without errors', () => {
    const html = normalizeHtml(renderToString(<CeremoniesPage />));
    expect(html).toContain('Ceremonies & Itinerary');
  });
});
