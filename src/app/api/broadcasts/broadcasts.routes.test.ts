import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as postRecipients } from './recipients/route';
import { GET as getGuestsExport } from './export/guests/route';
import { GET as getItineraryExport } from './export/itinerary/route';
import { GET as getCateringExport } from './export/catering/route';
import { BroadcastService } from '@/modules/broadcast/broadcast.service';
import { BROADCAST_TEMPLATES } from '@/modules/broadcast/broadcast.schema';
import { USER_ROLES } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Broadcasts & Exports API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Vivek', email: 'vivek@example.com' },
    session: {} as any,
    membership: {
      _id: 'm1' as any,
      userId: 'u1' as any,
      weddingId: 'w1' as any,
      role: USER_ROLES.ADMIN,
      joinedAt: new Date(),
    } as any,
    wedding: {
      id: 'w1',
      brideName: 'Eisha',
      groomName: 'Vivek',
      weddingDate: '2026-10-20',
      timeZone: 'Asia/Kolkata',
      website: { slug: 'eisha-vivek-20102026' },
    } as any,
    weddingId: 'w1',
    role: USER_ROLES.ADMIN,
  };

  describe('POST /api/broadcasts/recipients', () => {
    it('returns 200 with recipient preview details for authenticated wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(BroadcastService, 'getBroadcastRecipients').mockResolvedValue({
        template: BROADCAST_TEMPLATES.RSVP_REMINDER,
        templateMessage: 'Namaste {{guestName}} ji!',
        recipients: [
          {
            guestId: 'g1',
            name: 'Rajesh Sharma',
            phone: '919826012345',
            phoneDisplay: '+91 98260 12345',
            hasPhone: true,
            side: 'GROOM',
            rsvpStatus: 'PENDING',
            maxGuests: 4,
            attendingCount: null,
            dietary: 'PURE_VEG',
            personalInviteUrl: 'http://localhost:3000/invite/tok1',
            personalizedMessage: 'Namaste Rajesh Sharma ji!',
            whatsappUrl: 'https://api.whatsapp.com/send?phone=919826012345',
          },
        ],
        summary: {
          totalRecipients: 1,
          phoneReadyCount: 1,
          pendingRsvpCount: 1,
          attendingCount: 0,
        },
      });

      const req = new NextRequest('http://localhost:3000/api/broadcasts/recipients', {
        method: 'POST',
        body: JSON.stringify({
          template: BROADCAST_TEMPLATES.RSVP_REMINDER,
          rsvpStatus: 'ALL',
          side: 'ALL',
        }),
      });

      const res = await postRecipients(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.recipients).toHaveLength(1);
      expect(data.data.recipients[0].name).toBe('Rajesh Sharma');
    });
  });

  describe('GET /api/broadcasts/export/guests', () => {
    it('returns 200 with CSV headers and attachment disposition', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(BroadcastService, 'generateGuestManifestCSV').mockResolvedValue(
        '\uFEFFMake My Marriage — Official Guest Manifest\r\nRajesh Sharma,GROOM'
      );

      const req = new NextRequest('http://localhost:3000/api/broadcasts/export/guests');
      const res = await getGuestsExport(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      expect(res.headers.get('content-disposition')).toContain('wedding-guests-manifest.csv');

      const text = await res.text();
      expect(text).toContain('Official Guest Manifest');
    });
  });

  describe('GET /api/broadcasts/export/itinerary', () => {
    it('returns 200 with CSV run-sheet headers', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(BroadcastService, 'generateItineraryCSV').mockResolvedValue(
        '\uFEFFMake My Marriage — Ceremony Schedule\r\nMehendi,SANGEET'
      );

      const req = new NextRequest('http://localhost:3000/api/broadcasts/export/itinerary');
      const res = await getItineraryExport(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      expect(res.headers.get('content-disposition')).toContain('wedding-ceremonies-itinerary.csv');
    });
  });

  describe('GET /api/broadcasts/export/catering', () => {
    it('returns 200 with catering plates CSV', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(BroadcastService, 'generateCateringSummaryCSV').mockResolvedValue(
        '\uFEFFMake My Marriage — Halwai & Catering Plate Order Specification\r\nSangeet,100,20'
      );

      const req = new NextRequest('http://localhost:3000/api/broadcasts/export/catering');
      const res = await getCateringExport(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/csv');
      expect(res.headers.get('content-disposition')).toContain('wedding-catering-plates-summary.csv');
    });
  });
});
