import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { BroadcastMetricStrip } from '../broadcast-metric-strip';
import { WhatsAppBroadcastComposer } from '../whatsapp-broadcast-composer';
import { BroadcastRecipientTable } from '../broadcast-recipient-table';
import { ExportCenterCard } from '../export-center-card';
import { BROADCAST_TEMPLATES } from '@/modules/broadcast/broadcast.schema';
import { BroadcastRecipientDTO } from '@/modules/broadcast/broadcast.service';
import { GUEST_SIDE, RSVP_STATUS } from '@/shared/constants';

function normalizeHtml(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

describe('Broadcasts & Reports Components', () => {
  const mockRecipients: BroadcastRecipientDTO[] = [
    {
      guestId: 'g1',
      name: 'Rajesh Sharma',
      phone: '919826012345',
      phoneDisplay: '+91 98260 12345',
      hasPhone: true,
      side: GUEST_SIDE.GROOM,
      rsvpStatus: RSVP_STATUS.ATTENDING,
      maxGuests: 4,
      attendingCount: 4,
      dietary: 'PURE_VEG',
      personalInviteUrl: 'http://localhost:3000/invite/tok1',
      personalizedMessage: 'Namaste Rajesh Sharma ji! Please join our celebration.',
      whatsappUrl: 'https://api.whatsapp.com/send?phone=919826012345&text=Namaste',
    },
    {
      guestId: 'g2',
      name: 'Amit Patel',
      phone: null,
      phoneDisplay: 'No phone',
      hasPhone: false,
      side: GUEST_SIDE.BRIDE,
      rsvpStatus: RSVP_STATUS.PENDING,
      maxGuests: 2,
      attendingCount: null,
      dietary: 'JAIN',
      personalInviteUrl: 'http://localhost:3000/invite/tok2',
      personalizedMessage: 'Namaste Amit Patel ji! Please RSVP.',
      whatsappUrl: 'https://api.whatsapp.com/send?text=Namaste',
    },
  ];

  describe('BroadcastMetricStrip', () => {
    it('renders accurate metric numbers and labels', () => {
      const html = normalizeHtml(
        renderToString(
          <BroadcastMetricStrip
            totalRecipients={50}
            phoneReadyCount={40}
            pendingRsvpCount={15}
            attendingCount={68}
          />
        )
      );

      expect(html).toContain('Target Audience');
      expect(html).toContain('WhatsApp Ready');
      expect(html).toContain('Pending RSVPs');
      expect(html).toContain('Attending Headcount');

      expect(html).toContain('>50<');
      expect(html).toContain('>40<');
      expect(html).toContain('>15<');
      expect(html).toContain('>68<');
      expect(html).toContain('80%'); // 40/50 = 80%
    });
  });

  describe('WhatsAppBroadcastComposer', () => {
    it('renders template options and live WhatsApp phone simulator', () => {
      const html = normalizeHtml(
        renderToString(
          <WhatsAppBroadcastComposer
            selectedTemplate={BROADCAST_TEMPLATES.RSVP_REMINDER}
            onSelectTemplate={vi.fn()}
            rsvpFilter="ALL"
            onChangeRsvpFilter={vi.fn()}
            sideFilter="ALL"
            onChangeSideFilter={vi.fn()}
            ceremonyFilter=""
            onChangeCeremonyFilter={vi.fn()}
            ceremonies={[{ id: 'c1', name: 'Sangeet Night' }]}
            messageText="Namaste {{guestName}} ji! Please join {{coupleNames}}."
            onChangeMessageText={vi.fn()}
            sampleRecipient={mockRecipients[0]}
            coupleTitle="Vivek & Eisha"
          />
        )
      );

      expect(html).toContain('RSVP Reminder');
      expect(html).toContain('Ceremony Guide');
      expect(html).toContain('Photo Vault');
      expect(html).toContain('Virtual Stream');
      expect(html).toContain('Custom Note');

      // WhatsApp Simulator
      expect(html).toContain('Live WhatsApp Chat Preview');
      expect(html).toContain('Vivek & Eisha');
      expect(html).toContain('Make My Marriage Wedding Bot');
      expect(html).toContain('Namaste Rajesh Sharma ji! Please join Vivek & Eisha.');
      expect(html).toContain('✓✓');
    });
  });

  describe('BroadcastRecipientTable', () => {
    it('renders recipient rows with WhatsApp and Copy actions', () => {
      const html = normalizeHtml(
        renderToString(
          <BroadcastRecipientTable
            recipients={mockRecipients}
            onCopyText={vi.fn()}
          />
        )
      );

      expect(html).toContain('Rajesh Sharma');
      expect(html).toContain('+91 98260 12345');
      expect(html).toContain('GROOM');
      expect(html).toContain('ATTENDING');
      expect(html).toContain('4 Plates Confirmed');

      expect(html).toContain('Amit Patel');
      expect(html).toContain('No phone');
      expect(html).toContain('BRIDE');
      expect(html).toContain('PENDING');

      expect(html).toContain('Send WhatsApp');
      expect(html).toContain('Copy');
    });

    it('renders empty state when no recipients match', () => {
      const html = normalizeHtml(
        renderToString(
          <BroadcastRecipientTable
            recipients={[]}
            onCopyText={vi.fn()}
          />
        )
      );

      expect(html).toContain('No Matching Guests Found');
    });
  });

  describe('ExportCenterCard', () => {
    it('renders 3 download cards with correct CSV links', () => {
      const html = normalizeHtml(renderToString(<ExportCenterCard />));

      expect(html).toContain('Printable Reports & Spreadsheets');
      expect(html).toContain('Guest RSVP Manifest');
      expect(html).toContain('Ceremony Logistics Run-Sheet');
      expect(html).toContain('Halwai & Catering Plate Orders');

      expect(html).toContain('href="/api/broadcasts/export/guests"');
      expect(html).toContain('href="/api/broadcasts/export/itinerary"');
      expect(html).toContain('href="/api/broadcasts/export/catering"');
    });
  });
});
