import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { BroadcastService } from './broadcast.service';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { GuestModel } from '@/modules/guest/guest.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { NotFoundError } from '@/shared/errors/app-error';
import { BROADCAST_TEMPLATES } from './broadcast.schema';
import { RSVP_STATUS, DIETARY_PREFERENCE, GUEST_SIDE } from '@/shared/constants';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('BroadcastService', () => {
  const weddingId = new mongoose.Types.ObjectId().toString();
  const eventId1 = new mongoose.Types.ObjectId();
  const eventId2 = new mongoose.Types.ObjectId();

  const mockWeddingDoc = {
    _id: new mongoose.Types.ObjectId(weddingId),
    brideName: 'Eisha',
    groomName: 'Vivek',
    title: 'Vivek & Eisha',
    weddingDate: '2026-10-20',
    website: { slug: 'eisha-vivek-20102026' },
    gallery: { token: 'vault-tok-123' },
  };

  const mockEvents = [
    {
      _id: eventId1,
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: 'Mehendi & Sangeet',
      type: 'SANGEET',
      startsAt: new Date('2026-10-19T17:00:00.000Z'),
      endsAt: new Date('2026-10-19T22:00:00.000Z'),
      venueName: 'Royal Orchid Banquet',
      address: 'Indore, MP',
      dressCode: 'Indo-Western & Floral',
      description: 'Music, dance, and mehendi ceremony',
    },
    {
      _id: eventId2,
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: 'Pheras & Wedding Ceremony',
      type: 'WEDDING',
      startsAt: new Date('2026-10-20T11:00:00.000Z'),
      endsAt: new Date('2026-10-20T15:00:00.000Z'),
      venueName: 'Lake Palace Lawn',
      address: 'Indore, MP',
      dressCode: 'Traditional Pastel & Gold',
      description: 'Auspicious wedding rituals and lunch',
    },
  ];

  const mockGuests = [
    {
      _id: new mongoose.Types.ObjectId(),
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: 'Rajesh Sharma',
      phone: '9826012345', // 10-digit Indian
      side: GUEST_SIDE.GROOM,
      dietary: DIETARY_PREFERENCE.PURE_VEG,
      maxGuests: 4,
      attendingCount: 4,
      rsvpStatus: RSVP_STATUS.ATTENDING,
      invitedEventIds: [eventId1, eventId2],
      invitationToken: 'tok-rajesh',
    },
    {
      _id: new mongoose.Types.ObjectId(),
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: 'Amit Patel',
      phone: '+91 94250 99887', // formatted with +91
      side: GUEST_SIDE.BRIDE,
      dietary: DIETARY_PREFERENCE.JAIN,
      maxGuests: 2,
      attendingCount: null,
      rsvpStatus: RSVP_STATUS.PENDING,
      invitedEventIds: [eventId1],
      invitationToken: 'tok-amit',
    },
    {
      _id: new mongoose.Types.ObjectId(),
      weddingId: new mongoose.Types.ObjectId(weddingId),
      name: 'Pooja Verma',
      phone: null, // missing phone
      side: GUEST_SIDE.MUTUAL,
      dietary: DIETARY_PREFERENCE.NON_VEG,
      maxGuests: 2,
      attendingCount: 0,
      rsvpStatus: RSVP_STATUS.NOT_ATTENDING,
      invitedEventIds: [],
      invitationToken: 'tok-pooja',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBroadcastRecipients', () => {
    it('throws NotFoundError if wedding not found', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(
        BroadcastService.getBroadcastRecipients(weddingId, {
          template: BROADCAST_TEMPLATES.RSVP_REMINDER,
          rsvpStatus: 'ALL',
          side: 'ALL',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('returns recipients with personalized messages, invite links, and WhatsApp URLs', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);
      vi.spyOn(GuestModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockGuests),
      } as any);

      const result = await BroadcastService.getBroadcastRecipients(
        weddingId,
        {
          template: BROADCAST_TEMPLATES.RSVP_REMINDER,
          rsvpStatus: 'ALL',
          side: 'ALL',
        },
        'http://localhost:3000'
      );

      expect(result.summary.totalRecipients).toBe(3);
      expect(result.summary.phoneReadyCount).toBe(2);
      expect(result.summary.pendingRsvpCount).toBe(1);
      expect(result.summary.attendingCount).toBe(4);

      // Rajesh
      const rajesh = result.recipients.find((r) => r.name === 'Rajesh Sharma')!;
      expect(rajesh.hasPhone).toBe(true);
      expect(rajesh.phone).toBe('919826012345');
      expect(rajesh.personalInviteUrl).toBe('http://localhost:3000/invite/tok-rajesh');
      expect(rajesh.personalizedMessage).toContain('Rajesh Sharma');
      expect(rajesh.personalizedMessage).toContain('Vivek & Eisha');
      expect(rajesh.whatsappUrl).toContain('phone=919826012345');

      // Pooja (no phone)
      const pooja = result.recipients.find((r) => r.name === 'Pooja Verma')!;
      expect(pooja.hasPhone).toBe(false);
      expect(pooja.whatsappUrl).not.toContain('phone=');
    });

    it('substitutes schedule details in CEREMONY_ITINERARY template', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);
      vi.spyOn(GuestModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([mockGuests[0]]),
      } as any);

      const result = await BroadcastService.getBroadcastRecipients(
        weddingId,
        {
          template: BROADCAST_TEMPLATES.CEREMONY_ITINERARY,
          rsvpStatus: 'ALL',
          side: 'ALL',
        },
        'https://makemymarriage.com'
      );

      const rajesh = result.recipients[0];
      expect(rajesh.personalizedMessage).toContain('Mehendi & Sangeet');
      expect(rajesh.personalizedMessage).toContain('Royal Orchid Banquet');
      expect(rajesh.personalizedMessage).toContain('Pheras & Wedding Ceremony');
    });
  });

  describe('generateGuestManifestCSV', () => {
    it('creates a UTF-8 BOM CSV with summary headers and guest rows', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);
      vi.spyOn(GuestModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockGuests),
      } as any);

      const csv = await BroadcastService.generateGuestManifestCSV(weddingId);

      // Verify UTF-8 BOM
      expect(csv.startsWith('\uFEFF')).toBe(true);

      // Verify Header & Metadata
      expect(csv).toContain('Make My Marriage — Official Guest Manifest & RSVP Report');
      expect(csv).toContain('Vivek & Eisha');
      expect(csv).toContain('SUMMARY METRICS');
      expect(csv).toContain('Confirmed Attending Headcount,4');
      expect(csv).toContain('Attending Pure Veg Plates,4');

      // Verify Table Columns and Data
      expect(csv).toContain('Guest Name,Side,Phone Number,Email Address,RSVP Status');
      expect(csv).toContain('Rajesh Sharma,GROOM,9826012345,,ATTENDING,4,4,PURE_VEG');
      expect(csv).toContain('Amit Patel,BRIDE,+91 94250 99887,,PENDING,2,0,JAIN');
    });
  });

  describe('generateItineraryCSV', () => {
    it('creates a UTF-8 BOM CSV with chronological ceremonies', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);

      const csv = await BroadcastService.generateItineraryCSV(weddingId);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Make My Marriage — Ceremony Schedule & Logistics Run-Sheet');
      expect(csv).toContain('Mehendi & Sangeet,SANGEET');
      expect(csv).toContain('Royal Orchid Banquet,"Indore, MP",Indo-Western & Floral');
      expect(csv).toContain('Pheras & Wedding Ceremony,WEDDING');
      expect(csv).toContain('Lake Palace Lawn');
    });
  });

  describe('generateCateringSummaryCSV', () => {
    it('creates catering plate counts with +10% halwai safety buffer', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockEvents),
      } as any);
      // Only attending guests
      vi.spyOn(GuestModel, 'find').mockResolvedValue([mockGuests[0]] as any);

      const csv = await BroadcastService.generateCateringSummaryCSV(weddingId);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('Make My Marriage — Halwai & Catering Plate Order Specification');
      expect(csv).toContain('Pure Veg Plates,Jain (No Onion/Garlic) Plates,Non-Veg Plates');
      // Rajesh has 4 attending Pure Veg plates
      // +10% buffer of 4 is Math.ceil(0.4) = 1 buffer plate -> Total 5
      expect(csv).toContain('Mehendi & Sangeet');
      expect(csv).toContain('Royal Orchid Banquet,4,0,0,4,1,5');
    });
  });
});
