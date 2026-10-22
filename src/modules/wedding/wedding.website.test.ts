import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { WeddingService } from './wedding.service';
import { WeddingModel } from './wedding.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { NotFoundError } from '@/shared/errors/app-error';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('Wedding Website & Livestream Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockWeddingDoc.website.theme = 'crimson';
    mockWeddingDoc.website.isPublished = true;
    mockWeddingDoc.website.welcomeMessage = 'We would love to celebrate with you.';
    mockWeddingDoc.livestream.isEnabled = true;
    mockWeddingDoc.livestream.youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    mockWeddingDoc.livestream.scheduledStartTime = null;
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockSlug = 'vivek-eisha-20102026';

  const mockWeddingDoc = {
    _id: new mongoose.Types.ObjectId(mockWeddingId),
    brideName: 'Eisha',
    groomName: 'Vivek',
    title: 'Vivek & Eisha',
    description: 'Welcome to our celebration in Indore',
    weddingDate: '2026-10-20',
    timeZone: 'Asia/Kolkata',
    location: {
      city: 'Indore',
      state: 'Madhya Pradesh',
      formattedAddress: 'Indore, MP',
    },
    website: {
      slug: mockSlug,
      theme: 'crimson',
      isPublished: true,
      welcomeMessage: 'We would love to celebrate with you.',
    },
    gallery: {
      isEnabled: true,
      tokenHash: 'token_hash',
    },
    livestream: {
      provider: 'YOUTUBE',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      meetingUrl: null as string | null,
      instructions: null as string | null,
      scheduledStartTime: null as string | null,
      isEnabled: true,
    },
    save: vi.fn().mockResolvedValue(true),
  };

  describe('getWebsiteSettings', () => {
    it('returns website settings for a wedding', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const settings = await WeddingService.getWebsiteSettings(mockWeddingId);
      expect(settings.slug).toBe(mockSlug);
      expect(settings.theme).toBe('crimson');
      expect(settings.isPublished).toBe(true);
      expect(settings.welcomeMessage).toBe('We would love to celebrate with you.');
    });

    it('throws NotFoundError when wedding does not exist', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(WeddingService.getWebsiteSettings(mockWeddingId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWebsiteSettings', () => {
    it('updates theme, welcomeMessage, and isPublished', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const doc = { ...mockWeddingDoc, save: mockSave };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(doc as any);

      const updated = await WeddingService.updateWebsiteSettings(mockWeddingId, {
        theme: 'emerald',
        welcomeMessage: 'New heartfelt message',
        isPublished: true,
      });

      expect(mockSave).toHaveBeenCalled();
      expect(updated.theme).toBe('emerald');
      expect(updated.welcomeMessage).toBe('New heartfelt message');
    });
  });

  describe('getLivestreamSettings & updateLivestreamSettings', () => {
    it('returns livestream settings', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const settings = await WeddingService.getLivestreamSettings(mockWeddingId);
      expect(settings.isEnabled).toBe(true);
      expect(settings.youtubeUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('updates livestream URL and enabled toggle', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const doc = { ...mockWeddingDoc, save: mockSave };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(doc as any);

      const updated = await WeddingService.updateLivestreamSettings(mockWeddingId, {
        youtubeUrl: 'https://youtu.be/live123',
        isEnabled: false,
      });

      expect(mockSave).toHaveBeenCalled();
      expect(updated.youtubeUrl).toBe('https://youtu.be/live123');
      expect(updated.isEnabled).toBe(false);
    });

    it('updates Google Meet provider settings with meetingUrl and instructions', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const doc = { ...mockWeddingDoc, livestream: { ...mockWeddingDoc.livestream }, save: mockSave };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(doc as any);

      const updated = await WeddingService.updateLivestreamSettings(mockWeddingId, {
        provider: 'GOOGLE_MEET',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        instructions: 'Please mute mic during mantras',
        isEnabled: true,
      });

      expect(mockSave).toHaveBeenCalled();
      expect(updated.provider).toBe('GOOGLE_MEET');
      expect(updated.meetingUrl).toBe('https://meet.google.com/abc-defg-hij');
      expect(updated.instructions).toBe('Please mute mic during mantras');
      expect(updated.isEnabled).toBe(true);
    });
  });

  describe('getPublicWeddingBySlug', () => {
    it('returns public wedding data and populated ceremonies when published', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Pheras & Shubh Vivah',
            type: 'WEDDING',
            startsAt: new Date('2026-10-20T18:00:00Z'),
            endsAt: null,
            venueName: 'Sayaji Royal Banquets',
            address: 'Vijay Nagar, Indore',
            dressCode: 'Royal Ethnic',
            description: 'Vedic rituals',
          },
        ]),
      } as any);

      const result = await WeddingService.getPublicWeddingBySlug(mockSlug);

      expect(result.brideName).toBe('Eisha');
      expect(result.groomName).toBe('Vivek');
      expect(result.theme).toBe('crimson');
      expect(result.events.length).toBe(1);
      expect(result.events[0].name).toBe('Pheras & Shubh Vivah');
      expect(result.livestream.isEnabled).toBe(true);
    });

    it('throws NotFoundError if wedding is unpublished and allowUnpublished is false', async () => {
      const unpublishedDoc = {
        ...mockWeddingDoc,
        website: { ...mockWeddingDoc.website, isPublished: false },
      };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(unpublishedDoc as any);

      await expect(WeddingService.getPublicWeddingBySlug(mockSlug)).rejects.toThrow(NotFoundError);
    });

    it('returns wedding if unpublished but allowUnpublished is true (preview mode)', async () => {
      const unpublishedDoc = {
        ...mockWeddingDoc,
        website: { ...mockWeddingDoc.website, isPublished: false },
      };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(unpublishedDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await WeddingService.getPublicWeddingBySlug(mockSlug, {
        allowUnpublished: true,
      });

      expect(result.isPublished).toBe(false);
      expect(result.brideName).toBe('Eisha');
    });
  });
});
