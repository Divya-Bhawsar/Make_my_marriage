import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getGuests, POST as postGuest } from './route';
import {
  GET as getSingleGuest,
  PATCH as patchGuest,
  DELETE as deleteGuest,
} from './[guestId]/route';
import { GET as getInviteLink } from './[guestId]/invitation-link/route';
import { GET as getPlateSummary } from './plate-summary/route';
import { GET as getPublicInvite } from '../public/invitations/[token]/route';
import { POST as postPublicRsvp } from '../public/invitations/[token]/rsvp/route';
import { GuestService } from '@/modules/guest/guest.service';
import { USER_ROLES, RSVP_STATUS } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Guest & RSVP API Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockMemberContext = {
    user: { id: 'u1', name: 'Divya', email: 'divya@example.com' },
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

  describe('GET /api/guests', () => {
    it('returns 200 and list of guests for authenticated wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockGuests = [
        {
          id: 'g1',
          weddingId: 'w1',
          name: 'Rajesh Sharma',
          side: 'GROOM',
          dietary: 'PURE_VEG',
          maxGuests: 4,
          invitedEventIds: [],
          rsvpStatus: RSVP_STATUS.PENDING,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(GuestService, 'listGuests').mockResolvedValue({
        guests: mockGuests as any,
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      const request = new NextRequest('http://localhost:3000/api/guests');
      const response = await getGuests(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe('Rajesh Sharma');
      expect(json.pagination.total).toBe(1);
    });
  });

  describe('POST /api/guests', () => {
    it('creates a guest and returns 201', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockGuest = {
        id: 'g1',
        name: 'Gupta Family',
        side: 'BRIDE',
        maxGuests: 3,
        rsvpStatus: RSVP_STATUS.PENDING,
      };

      vi.spyOn(GuestService, 'createGuest').mockResolvedValue(mockGuest as any);

      const request = new NextRequest('http://localhost:3000/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Gupta Family',
          side: 'BRIDE',
          maxGuests: 3,
        }),
      });

        const response = await postGuest(request);
        expect(response.status).toBe(201);
        const json = await response.json();
        expect(json.data.name).toBe('Gupta Family');
      });

      it('patches guest rsvpStatus and attendingCount returning 200', async () => {
        vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

        const mockUpdated = {
          id: 'g1',
          name: 'Gupta Family',
          rsvpStatus: RSVP_STATUS.ATTENDING,
          attendingCount: 3,
        };

        vi.spyOn(GuestService, 'updateGuest').mockResolvedValue(mockUpdated as any);

        const request = new NextRequest('http://localhost:3000/api/guests/g1', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rsvpStatus: RSVP_STATUS.ATTENDING,
            attendingCount: 3,
          }),
        });

        const response = await patchGuest(request, { params: { guestId: 'g1' } });
        expect(response.status).toBe(200);
        const json = await response.json();
        expect(json.data.rsvpStatus).toBe(RSVP_STATUS.ATTENDING);
        expect(json.data.attendingCount).toBe(3);
      });
    });

  describe('GET /api/guests/[guestId]/invitation-link', () => {
    it('returns WhatsApp invitation link', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(GuestService, 'getGuestInvitationLink').mockResolvedValue(
        'http://localhost:3000/invite/secret-token-123'
      );

      const request = new NextRequest('http://localhost:3000/api/guests/g1/invitation-link');
      const response = await getInviteLink(request, { params: { guestId: 'g1' } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.url).toContain('/invite/secret-token-123');
    });
  });

  describe('GET /api/guests/plate-summary', () => {
    it('returns caterer plate count aggregation', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);

      const mockSummary = {
        totalGuestsCount: 10,
        totalCapacity: 35,
        confirmedAttendingPlates: 28,
        pendingCount: 5,
        declinedCount: 2,
        dietaryBreakdown: { ALL: 10, PURE_VEG: 12, JAIN: 4, NON_VEG: 2 },
        sideBreakdown: { GROOM: 16, BRIDE: 12, MUTUAL: 0 },
        eventSummaries: [],
      };

      vi.spyOn(GuestService, 'getCatererPlateSummary').mockResolvedValue(mockSummary as any);

      const request = new NextRequest('http://localhost:3000/api/guests/plate-summary');
      const response = await getPlateSummary(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.confirmedAttendingPlates).toBe(28);
      expect(json.data.dietaryBreakdown.PURE_VEG).toBe(12);
    });
  });

  describe('Public Invitation Endpoints', () => {
    it('GET /api/public/invitations/:token returns public invite data without auth', async () => {
      const mockPublicData = {
        guest: { name: 'Rajesh Sharma', maxGuests: 4, rsvpStatus: 'PENDING' },
        wedding: { brideName: 'Eisha', groomName: 'Vivek', weddingDate: '2026-10-20' },
        events: [],
      };

      vi.spyOn(GuestService, 'getPublicInvitation').mockResolvedValue(mockPublicData as any);

      const request = new NextRequest('http://localhost:3000/api/public/invitations/tok123');
      const response = await getPublicInvite(request, { params: { token: 'tok123' } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.guest.name).toBe('Rajesh Sharma');
      expect(json.data.wedding.groomName).toBe('Vivek');
    });

    it('POST /api/public/invitations/:token/rsvp submits RSVP attendance', async () => {
      vi.spyOn(GuestService, 'submitPublicRsvp').mockResolvedValue({
        success: true,
        rsvpStatus: RSVP_STATUS.ATTENDING,
        attendingCount: 3,
      } as any);

      const request = new NextRequest('http://localhost:3000/api/public/invitations/tok123/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ATTENDING',
          attendingCount: 3,
          dietary: 'PURE_VEG',
        }),
      });

      const response = await postPublicRsvp(request, { params: { token: 'tok123' } });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.rsvpStatus).toBe('ATTENDING');
    });
  });
});
