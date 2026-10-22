import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import fs from 'fs';
import { PhotoService } from './photo.service';
import { PhotoModel } from './photo.model';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { NotFoundError, ValidationError, ForbiddenError } from '@/shared/errors/app-error';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn().mockReturnValue(true),
      promises: {
        mkdir: vi.fn().mockResolvedValue(undefined),
        writeFile: vi.fn().mockResolvedValue(undefined),
        unlink: vi.fn().mockResolvedValue(undefined),
      },
    },
  };
});

describe('PhotoService', () => {
  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockToken = 'test-token-1234567890abcdef123456';

  const mockWeddingDoc = {
    _id: new mongoose.Types.ObjectId(mockWeddingId),
    brideName: 'Eisha',
    groomName: 'Vivek',
    title: 'Vivek & Eisha',
    weddingDate: '2026-10-20',
    location: { city: 'Indore', formattedAddress: 'Indore, MP' },
    website: { slug: 'eisha-vivek-20102026', theme: 'crimson' },
    gallery: {
      token: mockToken,
      tokenHash: 'hashed-token-value',
      isEnabled: true,
      guestUploadsEnabled: true,
    },
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockWeddingDoc.gallery.isEnabled = true;
    mockWeddingDoc.gallery.guestUploadsEnabled = true;
    mockWeddingDoc.gallery.token = mockToken;
    vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
      sort: vi.fn().mockResolvedValue([]),
    } as any);
  });

  describe('getGallerySettings', () => {
    it('returns gallery settings for existing wedding', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const result = await PhotoService.getGallerySettings(mockWeddingId);

      expect(result.isEnabled).toBe(true);
      expect(result.guestUploadsEnabled).toBe(true);
      expect(result.token).toBe(mockToken);
      expect(result.gallerySlug).toBe('eisha-vivek-20102026');
    });

    it('generates token and saves if missing in wedding', async () => {
      const docWithoutToken = {
        ...mockWeddingDoc,
        gallery: {
          isEnabled: true,
          guestUploadsEnabled: true,
          token: undefined,
          tokenHash: undefined,
        },
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(docWithoutToken as any);

      const result = await PhotoService.getGallerySettings(mockWeddingId);

      expect(result.token).toBeDefined();
      expect(docWithoutToken.save).toHaveBeenCalled();
    });

    it('throws NotFoundError if wedding does not exist', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(PhotoService.getGallerySettings(mockWeddingId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateGallerySettings', () => {
    it('updates toggles and regenerates token', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const result = await PhotoService.updateGallerySettings(mockWeddingId, {
        isEnabled: false,
        guestUploadsEnabled: false,
        regenerateToken: true,
      });

      expect(result.isEnabled).toBe(false);
      expect(result.guestUploadsEnabled).toBe(false);
      expect(result.token).not.toBe(mockToken);
      expect(mockWeddingDoc.save).toHaveBeenCalled();
    });
  });

  describe('listPhotos', () => {
    it('returns paginated ready photos and metrics', async () => {
      const mockPhotos = [
        {
          _id: new mongoose.Types.ObjectId(),
          weddingId: new mongoose.Types.ObjectId(mockWeddingId),
          eventId: null,
          uploaderType: 'MEMBER',
          uploaderName: null,
          uploadedByUserId: null,
          objectKey: 'weddings/1/photos/1.jpg',
          imageUrl: '/uploads/weddings/1/photos/1.jpg',
          thumbnailUrl: null,
          filename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024 * 500,
          caption: 'Haldi smile',
          status: 'READY',
          createdAt: new Date('2026-10-17T10:00:00Z'),
        },
      ];

      const findQuery = {
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockPhotos),
      };

      vi.spyOn(PhotoModel, 'find').mockReturnValue(findQuery as any);
      vi.spyOn(PhotoModel, 'countDocuments')
        .mockResolvedValueOnce(5) // totalCount
        .mockResolvedValueOnce(2); // guestCount
      vi.spyOn(PhotoModel, 'aggregate').mockResolvedValue([{ _id: null, totalBytes: 2048000 }]);

      const result = await PhotoService.listPhotos(mockWeddingId, { limit: 10 });

      expect(result.photos.length).toBe(1);
      expect(result.photos[0].filename).toBe('photo1.jpg');
      expect(result.metrics.totalCount).toBe(5);
      expect(result.metrics.guestCount).toBe(2);
      expect(result.metrics.memberCount).toBe(3);
      expect(result.metrics.totalSizeBytes).toBe(2048000);
    });
  });

  describe('uploadPhoto', () => {
    it('rejects unsupported image mime type', async () => {
      await expect(
        PhotoService.uploadPhoto({
          weddingId: mockWeddingId,
          uploaderType: 'MEMBER',
          fileBuffer: Buffer.from('hello'),
          filename: 'test.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects empty file buffer', async () => {
      await expect(
        PhotoService.uploadPhoto({
          weddingId: mockWeddingId,
          uploaderType: 'MEMBER',
          fileBuffer: Buffer.from(''),
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('rejects file exceeding 10MB', async () => {
      const hugeBuffer = Buffer.alloc(11 * 1024 * 1024);
      await expect(
        PhotoService.uploadPhoto({
          weddingId: mockWeddingId,
          uploaderType: 'MEMBER',
          fileBuffer: hugeBuffer,
          filename: 'huge.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('successfully uploads and stores photo', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);

      const fakeCreated = {
        _id: new mongoose.Types.ObjectId(),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        eventId: null,
        uploaderType: 'MEMBER',
        uploaderName: null,
        uploadedByUserId: null,
        objectKey: `weddings/${mockWeddingId}/photos/test.jpg`,
        imageUrl: `/uploads/weddings/${mockWeddingId}/photos/test.jpg`,
        thumbnailUrl: null,
        filename: 'my-photo.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1000,
        caption: 'Sacred pheras',
        status: 'READY',
        createdAt: new Date('2026-10-17T12:00:00Z'),
      };
      vi.spyOn(PhotoModel, 'create').mockResolvedValue(fakeCreated as any);

      const result = await PhotoService.uploadPhoto({
        weddingId: mockWeddingId,
        uploaderType: 'MEMBER',
        fileBuffer: Buffer.from('dummy image data'),
        filename: 'my-photo.jpg',
        mimeType: 'image/jpeg',
        caption: 'Sacred pheras',
      });

      expect(result.filename).toBe('my-photo.jpg');
      expect(result.caption).toBe('Sacred pheras');
      expect(result.imageUrl).toContain('/uploads/weddings/');
    });
  });

  describe('deletePhoto', () => {
    it('marks photo as DELETED and unlinks local file', async () => {
      const mockPhoto = {
        _id: new mongoose.Types.ObjectId(),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        imageUrl: '/uploads/weddings/test.jpg',
        status: 'READY',
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(PhotoModel, 'findOne').mockResolvedValue(mockPhoto as any);

      const result = await PhotoService.deletePhoto(mockWeddingId, mockPhoto._id.toString());

      expect(result.success).toBe(true);
      expect(mockPhoto.status).toBe('DELETED');
      expect(mockPhoto.save).toHaveBeenCalled();
    });

    it('throws NotFoundError if photo not found', async () => {
      vi.spyOn(PhotoModel, 'findOne').mockResolvedValue(null);

      await expect(
        PhotoService.deletePhoto(mockWeddingId, new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPublicGalleryByToken', () => {
    it('returns public gallery info when enabled', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWeddingDoc as any);
      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Sangeet Night',
            type: 'SANGEET',
            startsAt: new Date('2026-10-19T18:00:00Z'),
          },
        ]),
      } as any);

      const result = await PhotoService.getPublicGalleryByToken(mockToken);

      expect(result.groomName).toBe('Vivek');
      expect(result.brideName).toBe('Eisha');
      expect(result.events.length).toBe(1);
      expect(result.events[0].name).toBe('Sangeet Night');
    });

    it('throws ForbiddenError if gallery is disabled', async () => {
      const disabledDoc = {
        ...mockWeddingDoc,
        gallery: { ...mockWeddingDoc.gallery, isEnabled: false },
      };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(disabledDoc as any);

      await expect(PhotoService.getPublicGalleryByToken(mockToken)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('uploadGuestPhoto', () => {
    it('throws ForbiddenError if guestUploadsEnabled is false', async () => {
      const disabledGuestDoc = {
        ...mockWeddingDoc,
        gallery: { ...mockWeddingDoc.gallery, guestUploadsEnabled: false },
      };
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(disabledGuestDoc as any);

      await expect(
        PhotoService.uploadGuestPhoto(mockToken, {
          fileBuffer: Buffer.from('data'),
          filename: 'guest.jpg',
          mimeType: 'image/jpeg',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
