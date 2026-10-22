import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { CatererPlateBanner, PlateSummaryData } from '@/components/guests/caterer-plate-banner';
import { GuestModal } from '@/components/guests/guest-modal';
import { GuestRoster } from '@/components/guests/guest-roster';
import GuestsPage from '@/app/(dashboard)/app/guests/page';
import { PublicInviteCard } from '@/components/invite/public-invite-card';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/app/guests',
}));

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Guest & Caterer Plate UI Components', () => {
  const mockSummary: PlateSummaryData = {
    totalGuestsCount: 20,
    totalCapacity: 65,
    confirmedAttendingPlates: 48,
    pendingCount: 12,
    declinedCount: 5,
    dietaryBreakdown: {
      ALL: 18,
      PURE_VEG: 22,
      JAIN: 6,
      NON_VEG: 2,
    },
    sideBreakdown: {
      GROOM: 28,
      BRIDE: 20,
      MUTUAL: 0,
    },
    eventSummaries: [
      {
        eventId: 'e1',
        name: 'Sangeet & DJ Night',
        type: 'SANGEET',
        startsAt: '2026-10-19T18:00:00.000Z',
        confirmedPlates: 48,
      },
    ],
  };

  it('renders CatererPlateBanner with plate counts and dietary distribution', () => {
    const html = normalizeHtml(
      renderToString(<CatererPlateBanner summary={mockSummary} isLoading={false} />)
    );

    expect(html).toContain('Caterer Plate & Headcount Calculator');
    expect(html).toContain('48');
    expect(html).toContain('Confirmed Plates');
    expect(html).toContain('65');
    expect(html).toContain('Total Capacity');
    expect(html).toContain('Pure Veg: 22');
    expect(html).toContain('Jain: 6');
    expect(html).toContain('Sangeet & DJ Night');
  });

  it('renders GuestModal with fields for family name, side, party size, and dietary', () => {
    const html = normalizeHtml(
      renderToString(
        <GuestModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          events={[]}
          groomName="Vivek"
          brideName="Eisha"
        />
      )
    );

    expect(html).toContain('Add Guest / Family');
    expect(html).toContain('Guest / Family Name');
    expect(html).toContain("Vivek's Side");
    expect(html).toContain("Eisha's Side");
    expect(html).toContain('Max Party Size');
    expect(html).toContain('Dietary Requirement');
  });

  it('does not render GuestModal when isOpen is false', () => {
    const html = renderToString(
      <GuestModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
        events={[]}
      />
    );
    expect(html).toBe('');
  });

  it('renders GuestModal with RSVP status controls when editing a guest', () => {
    const mockGuestToEdit = {
      id: 'g1',
      weddingId: 'w1',
      name: 'Sharma Family',
      side: 'GROOM' as const,
      dietary: 'PURE_VEG' as const,
      maxGuests: 4,
      invitedEventIds: [],
      invitationToken: 'test-token-123',
      rsvpStatus: 'ATTENDING' as const,
      attendingCount: 3,
      createdAt: '2026-10-17T00:00:00.000Z',
      updatedAt: '2026-10-17T00:00:00.000Z',
    };

    const html = normalizeHtml(
      renderToString(
        <GuestModal
          isOpen={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
          guestToEdit={mockGuestToEdit}
          events={[]}
          groomName="Vivek"
          brideName="Eisha"
        />
      )
    );

    expect(html).toContain('RSVP & Attendance Status');
    expect(html).toContain('RSVP Response');
    expect(html).toContain('Confirmed Attending Plates');
  });

  it('renders GuestRoster with table actions, filters, and Add Guest button', () => {
    const html = normalizeHtml(renderToString(<GuestRoster />));
    expect(html).toContain('Wedding Guest Roster');
    expect(html).toContain('Add Guest / Family');
    expect(html).toContain('Search by name, phone, or email');
  });

  it('renders GuestsPage route page without errors', () => {
    const html = normalizeHtml(renderToString(<GuestsPage />));
    expect(html).toContain('Wedding Guest Roster');
    expect(html).toContain('Guests & RSVPs');
  });

  it('renders PublicInviteCard initial loading state without errors', () => {
    const html = normalizeHtml(renderToString(<PublicInviteCard token="test-token" />));
    expect(html).toContain('Opening your wedding invitation');
  });
});
