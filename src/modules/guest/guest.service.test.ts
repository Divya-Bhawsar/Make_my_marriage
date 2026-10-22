import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { GuestService } from './guest.service';
import { GuestModel } from './guest.model';
import { WeddingModel } from '../wedding/wedding.model';
import { WeddingEventModel } from '../event/event.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import { RSVP_STATUS } from '@/shared/constants';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('GuestService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockGuestId = new mongoose.Types.ObjectId().toString();
  const mockToken = 'abc123securetokenxyz';

  describe('createGuest', () => {
    it('creates a guest with generated invitationToken and default values', async () => {
      const mockCreated = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Rajesh Sharma & Family',
        email: 'rajesh@example.com',
        emailNormalized: 'rajesh@example.com',
        phone: '+919876543210',
        side: 'GROOM',
        dietary: 'PURE_VEG',
        maxGuests: 4,
        invitedEventIds: [],
        invitationToken: mockToken,
        rsvpStatus: RSVP_STATUS.PENDING,
        attendingCount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(GuestModel, 'create').mockResolvedValue(mockCreated as any);

      const result = await GuestService.createGuest(mockWeddingId, {
        name: 'Rajesh Sharma & Family',
        email: 'rajesh@example.com',
        phone: '+919876543210',
        side: 'GROOM',
        dietary: 'PURE_VEG',
        maxGuests: 4,
        invitedEventIds: [],
      });

      expect(result.id).toBe(mockGuestId);
      expect(result.name).toBe('Rajesh Sharma & Family');
      expect(result.maxGuests).toBe(4);
      expect(result.dietary).toBe('PURE_VEG');
      expect(result.invitationToken).toBe('abc123securetokenxyz');
    });
  });

  describe('updateGuest', () => {
    it('throws ValidationError when reducing maxGuests below existing attendingCount', async () => {
      const mockGuest = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Sharma Family',
        maxGuests: 4,
        attendingCount: 3,
        rsvpStatus: RSVP_STATUS.ATTENDING,
      };

      vi.spyOn(GuestModel, 'findOne').mockResolvedValue(mockGuest as any);

      await expect(
        GuestService.updateGuest(mockWeddingId, mockGuestId, {
          maxGuests: 2, // Less than current attendingCount (3)
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getGuestInvitationLink', () => {
    it('returns public invite link with token', async () => {
      const mockGuest = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        invitationToken: 'secret-token-123',
      };

      vi.spyOn(GuestModel, 'findOne').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockGuest),
      } as any);

      const link = await GuestService.getGuestInvitationLink(mockWeddingId, mockGuestId);
      expect(link).toContain('/invite/secret-token-123');
    });
  });

  describe('getPublicInvitation & submitPublicRsvp', () => {
    it('returns public invitation data without sensitive IDs', async () => {
      const mockGuest = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Sharma Family',
        side: 'GROOM',
        dietary: 'PURE_VEG',
        maxGuests: 3,
        rsvpStatus: RSVP_STATUS.PENDING,
        invitedEventIds: [],
      };

      const mockWedding = {
        brideName: 'Eisha',
        groomName: 'Vivek',
        weddingDate: '2026-10-20',
        title: "Vivek & Eisha's Wedding",
        location: { city: 'Indore' },
      };

      vi.spyOn(GuestModel, 'findOne').mockResolvedValue(mockGuest as any);
      vi.spyOn(WeddingModel, 'findById').mockResolvedValue(mockWedding as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await GuestService.getPublicInvitation(mockToken);
      expect(result.guest.name).toBe('Sharma Family');
      expect(result.wedding.groomName).toBe('Vivek');
      expect(result.wedding.brideName).toBe('Eisha');
    });

    it('submits valid RSVP and updates guest record', async () => {
      const mockGuest = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        maxGuests: 4,
        rsvpStatus: RSVP_STATUS.PENDING,
        attendingCount: null,
        dietary: 'ALL',
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(GuestModel, 'findOne').mockResolvedValue(mockGuest as any);

      const result = await GuestService.submitPublicRsvp(mockToken, {
        status: RSVP_STATUS.ATTENDING,
        attendingCount: 3,
        dietary: 'PURE_VEG',
        wishes: 'Congratulations Vivek & Eisha!',
      });

      expect(result.success).toBe(true);
      expect(mockGuest.rsvpStatus).toBe(RSVP_STATUS.ATTENDING);
      expect(mockGuest.attendingCount).toBe(3);
      expect(mockGuest.dietary).toBe('PURE_VEG');
      expect(mockGuest.save).toHaveBeenCalled();
    });

    it('rejects RSVP if attendingCount exceeds maxGuests', async () => {
      const mockGuest = {
        _id: new mongoose.Types.ObjectId(mockGuestId),
        maxGuests: 2,
        rsvpStatus: RSVP_STATUS.PENDING,
      };

      vi.spyOn(GuestModel, 'findOne').mockResolvedValue(mockGuest as any);

      await expect(
        GuestService.submitPublicRsvp(mockToken, {
          status: RSVP_STATUS.ATTENDING,
          attendingCount: 5, // Exceeds maxGuests (2)
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getCatererPlateSummary', () => {
    it('aggregates total plates, dietary breakdown, and per-event plate count', async () => {
      const mockEventId = new mongoose.Types.ObjectId();
      const mockEvents = [
        {
          _id: mockEventId,
          name: 'Reception',
          type: 'RECEPTION',
          startsAt: new Date('2026-10-20T19:00:00.000Z'),
        },
      ];

      const mockGuests = [
        {
          maxGuests: 4,
          attendingCount: 3,
          rsvpStatus: RSVP_STATUS.ATTENDING,
          dietary: 'JAIN',
          side: 'GROOM',
          invitedEventIds: [mockEventId],
        },
        {
          maxGuests: 2,
          attendingCount: null,
          rsvpStatus: RSVP_STATUS.PENDING,
          dietary: 'ALL',
          side: 'BRIDE',
          invitedEventIds: [mockEventId],
        },
      ];

      vi.spyOn(GuestModel, 'find').mockResolvedValue(mockGuests as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);

      const summary = await GuestService.getCatererPlateSummary(mockWeddingId);
      expect(summary.totalGuestsCount).toBe(2);
      expect(summary.totalCapacity).toBe(6);
      expect(summary.confirmedAttendingPlates).toBe(3);
      expect(summary.pendingCount).toBe(1);
      expect(summary.dietaryBreakdown.JAIN).toBe(3);
      expect(summary.eventSummaries[0].confirmedPlates).toBe(3);
    });
  });
});
