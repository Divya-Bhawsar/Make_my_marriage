import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { WeddingService } from './wedding.service';
import { WeddingModel } from './wedding.model';
import { WeddingMembershipModel } from './membership.model';
import { ConflictError, NotFoundError } from '@/shared/errors/app-error';
import { USER_ROLES } from '@/shared/constants';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('WeddingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('createWedding', () => {
    it('creates wedding and initial Admin membership atomically', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockWeddingId = new mongoose.Types.ObjectId();

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null); // No slug collision

      const mockWedding = {
        _id: mockWeddingId,
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        timeZone: 'Asia/Kolkata',
        website: { slug: 'princi-akshay-14022027', theme: 'CLASSIC', isPublished: false },
        gallery: { tokenHash: 'secret-hash', isEnabled: true, guestUploadsEnabled: true },
        livestream: { isEnabled: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingModel, 'create').mockResolvedValue(mockWedding as any);
      const membershipSpy = vi.spyOn(WeddingMembershipModel, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(mockUserId),
        weddingId: mockWeddingId,
        role: USER_ROLES.ADMIN,
      } as any);

      const result = await WeddingService.createWedding(mockUserId, {
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        timeZone: 'Asia/Kolkata',
      });

      expect(result.wedding.id).toBe(mockWeddingId.toString());
      expect(result.wedding.website.slug).toBe('princi-akshay-14022027');
      expect((result.wedding as any).gallery.tokenHash).toBeUndefined(); // Suppressed from DTO!
      expect(membershipSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          role: USER_ROLES.ADMIN,
        })
      );
    });

    it('rejects wedding creation if user already belongs to a wedding', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue({ _id: 'm1' } as any);

      await expect(
        WeddingService.createWedding(mockUserId, {
          brideName: 'Princi',
          groomName: 'Akshay',
          weddingDate: '2027-02-14',
          timeZone: 'Asia/Kolkata',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('cleans up created wedding if membership creation throws an error', async () => {
      const mockUserId = new mongoose.Types.ObjectId().toString();
      const mockWeddingId = new mongoose.Types.ObjectId();

      vi.spyOn(WeddingMembershipModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      const mockWedding = {
        _id: mockWeddingId,
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        website: { slug: 'princi-akshay-14022027' },
        gallery: {},
        livestream: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingModel, 'create').mockResolvedValue(mockWedding as any);
      vi.spyOn(WeddingMembershipModel, 'create').mockRejectedValue(new Error('DB Constraint'));
      const deleteSpy = vi.spyOn(WeddingModel, 'deleteOne').mockResolvedValue({} as any);

      await expect(
        WeddingService.createWedding(mockUserId, {
          brideName: 'Princi',
          groomName: 'Akshay',
          weddingDate: '2027-02-14',
          timeZone: 'Asia/Kolkata',
        })
      ).rejects.toThrow('DB Constraint');

      expect(deleteSpy).toHaveBeenCalledWith({ _id: mockWeddingId });
    });
  });

  describe('getWeddingById', () => {
    it('returns wedding DTO when active wedding exists', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockWedding = {
        _id: mockId,
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        timeZone: 'Asia/Kolkata',
        website: { slug: 'princi-akshay-14022027', theme: 'CLASSIC', isPublished: false },
        gallery: { isEnabled: true, guestUploadsEnabled: true },
        livestream: { isEnabled: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWedding as any);

      const result = await WeddingService.getWeddingById(mockId.toString());
      expect(result.id).toBe(mockId.toString());
      expect(result.brideName).toBe('Princi');
    });

    it('throws NotFoundError when wedding does not exist', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      await expect(
        WeddingService.getWeddingById(new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateWedding', () => {
    it('updates allowed wedding fields without mutating slug', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockWedding = {
        _id: mockId,
        brideName: 'Princi',
        groomName: 'Akshay',
        weddingDate: '2027-02-14',
        timeZone: 'Asia/Kolkata',
        website: { slug: 'immutable-slug', theme: 'CLASSIC', isPublished: false },
        gallery: { isEnabled: true, guestUploadsEnabled: true },
        livestream: { isEnabled: false },
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(mockWedding as any);

      const updated = await WeddingService.updateWedding(mockId.toString(), {
        brideName: 'Princi Sharma',
        description: 'Updated celebration description',
      });

      expect(updated.brideName).toBe('Princi Sharma');
      expect(updated.description).toBe('Updated celebration description');
      expect(updated.website.slug).toBe('immutable-slug');
      expect(mockWedding.save).toHaveBeenCalled();
    });
  });
});
