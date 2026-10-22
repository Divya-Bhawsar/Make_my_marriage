import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { VendorService } from './vendor.service';
import { VendorModel } from './vendor.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { ExpenseModel } from '@/modules/expense/expense.model';
import { WeddingModel } from '@/modules/wedding/wedding.model';
import { NotFoundError, ValidationError, ConflictError } from '@/shared/errors/app-error';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('VendorService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockVendorId = new mongoose.Types.ObjectId().toString();
  const mockEventId = new mongoose.Types.ObjectId().toString();

  describe('createVendor', () => {
    it('creates a manual vendor successfully and converts rupees to paise', async () => {
      const mockCreatedVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'The Wedding Filmer Central',
        category: 'PHOTOGRAPHER',
        contactPerson: 'Rohit Sharma',
        phone: '+91 98260 11223',
        email: 'rohit@filmer.in',
        address: 'Saket Nagar, Indore',
        website: 'https://weddingfilmer.in',
        totalAgreedCostPaise: 25000000,
        eventIds: [],
        notes: 'Drone included',
        source: 'MANUAL',
        googlePlaceId: null,
        rating: null,
        userRatingsTotal: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(VendorModel, 'create').mockResolvedValue(mockCreatedVendor as any);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([]);

      const result = await VendorService.createVendor(mockWeddingId, {
        name: 'The Wedding Filmer Central',
        category: 'PHOTOGRAPHER',
        contactPerson: 'Rohit Sharma',
        phone: '+91 98260 11223',
        email: 'rohit@filmer.in',
        address: 'Saket Nagar, Indore',
        website: 'https://weddingfilmer.in',
        totalAgreedCost: 250000, // ₹2,50,000 -> 25000000 paise
        notes: 'Drone included',
      });

      expect(result.id).toBe(mockVendorId);
      expect(result.name).toBe('The Wedding Filmer Central');
      expect(result.category).toBe('PHOTOGRAPHER');
      expect(result.totalAgreedCostPaise).toBe(25000000);
      expect(result.source).toBe('MANUAL');
    });

    it('validates ceremony IDs and throws ValidationError if ceremony does not belong to wedding', async () => {
      vi.spyOn(WeddingEventModel, 'countDocuments').mockResolvedValue(0);

      await expect(
        VendorService.createVendor(mockWeddingId, {
          name: 'Royal Shutter',
          category: 'PHOTOGRAPHER',
          eventIds: [mockEventId],
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('createVendorFromPlace', () => {
    it('creates a vendor from a Google Place and sets source to GOOGLE_PLACES', async () => {
      vi.spyOn(VendorModel, 'findOne').mockResolvedValue(null);

      const mockPlaceVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Brilliant Convention Centre & Grand Lawn',
        category: 'VENUE',
        contactPerson: null,
        phone: '+91 731 478 9000',
        email: null,
        address: 'Vijay Nagar, Indore',
        website: 'https://brilliantconvention.com',
        totalAgreedCostPaise: null,
        eventIds: [],
        notes: null,
        source: 'GOOGLE_PLACES',
        googlePlaceId: 'indore_venue_brilliant',
        rating: 4.9,
        userRatingsTotal: 412,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(VendorModel, 'create').mockResolvedValue(mockPlaceVendor as any);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([]);

      const result = await VendorService.createVendorFromPlace(mockWeddingId, {
        googlePlaceId: 'indore_venue_brilliant',
      });

      expect(result.name).toBe('Brilliant Convention Centre & Grand Lawn');
      expect(result.category).toBe('VENUE');
      expect(result.source).toBe('GOOGLE_PLACES');
      expect(result.rating).toBe(4.9);
    });

    it('throws ConflictError if the Google Place is already added to active vendors', async () => {
      vi.spyOn(VendorModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: 'Sayaji Banquets',
      } as any);

      await expect(
        VendorService.createVendorFromPlace(mockWeddingId, {
          googlePlaceId: 'indore_venue_sayaji',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('listVendors', () => {
    it('returns paginated vendor list with event summaries', async () => {
      const mockVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Sayaji Royal Catering & Shahi Halwai',
        category: 'CATERER',
        contactPerson: 'Masterji',
        phone: '+91 98930 45678',
        email: null,
        address: 'Indore',
        website: null,
        totalAgreedCostPaise: 45000000,
        eventIds: [new mongoose.Types.ObjectId(mockEventId)],
        notes: null,
        source: 'MANUAL',
        googlePlaceId: null,
        rating: null,
        userRatingsTotal: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(VendorModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(VendorModel, 'find').mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockVendor]),
      } as any);

      vi.spyOn(WeddingEventModel, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(mockEventId),
            name: 'Pheras & Shubh Vivah',
            type: 'WEDDING',
            startsAt: new Date('2026-10-20T18:00:00Z'),
          },
        ]),
      } as any);

      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([
        { _id: null, totalExpensesPaise: 45000000, totalPaidPaise: 15000000 },
      ]);

      const result = await VendorService.listVendors(mockWeddingId, {
        page: 1,
        limit: 20,
        includeArchived: false,
      });

      expect(result.total).toBe(1);
      expect(result.vendors.length).toBe(1);
      expect(result.vendors[0].events.length).toBe(1);
      expect(result.vendors[0].events[0].name).toBe('Pheras & Shubh Vivah');
      expect(result.vendors[0].totalPaidPaise).toBe(15000000);
    });
  });

  describe('getVendorById', () => {
    it('returns a single vendor when found', async () => {
      const mockVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Kashish Bridal Makeover Studio',
        category: 'MAKEUP_ARTIST',
        eventIds: [],
        source: 'MANUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(VendorModel, 'findOne').mockResolvedValue(mockVendor as any);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([]);

      const result = await VendorService.getVendorById(mockWeddingId, mockVendorId);
      expect(result.id).toBe(mockVendorId);
      expect(result.name).toBe('Kashish Bridal Makeover Studio');
    });

    it('throws NotFoundError when vendor is not found', async () => {
      vi.spyOn(VendorModel, 'findOne').mockResolvedValue(null);

      await expect(
        VendorService.getVendorById(mockWeddingId, mockVendorId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('archiveVendor & unarchiveVendor', () => {
    it('soft archives a vendor by setting archivedAt', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Malwa Phool',
        category: 'DECORATOR',
        archivedAt: null,
        eventIds: [],
        source: 'MANUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: mockSave,
      };

      vi.spyOn(VendorModel, 'findOne').mockResolvedValue(mockVendor as any);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([]);

      const result = await VendorService.archiveVendor(mockWeddingId, mockVendorId);
      expect(mockSave).toHaveBeenCalled();
      expect(result.archivedAt).toBeTruthy();
    });

    it('unarchives a vendor by clearing archivedAt', async () => {
      const mockSave = vi.fn().mockResolvedValue(true);
      const mockVendor = {
        _id: new mongoose.Types.ObjectId(mockVendorId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        name: 'Malwa Phool',
        category: 'DECORATOR',
        archivedAt: new Date(),
        eventIds: [],
        source: 'MANUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
        save: mockSave,
      };

      vi.spyOn(VendorModel, 'findOne').mockResolvedValue(mockVendor as any);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([]);

      const result = await VendorService.unarchiveVendor(mockWeddingId, mockVendorId);
      expect(mockSave).toHaveBeenCalled();
      expect(result.archivedAt).toBeNull();
    });
  });

  describe('deleteVendor', () => {
    it('permanently deletes vendor when no expenses are linked', async () => {
      vi.spyOn(VendorModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(mockVendorId),
        name: 'Unused Vendor',
      } as any);
      vi.spyOn(ExpenseModel, 'countDocuments').mockResolvedValue(0);
      vi.spyOn(VendorModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      const result = await VendorService.deleteVendor(mockWeddingId, mockVendorId);
      expect(result.deleted).toBe(true);
    });

    it('throws ValidationError if expenses are linked to the vendor', async () => {
      vi.spyOn(VendorModel, 'findOne').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(mockVendorId),
        name: 'Sharma Caterers',
      } as any);
      vi.spyOn(ExpenseModel, 'countDocuments').mockResolvedValue(2);

      await expect(
        VendorService.deleteVendor(mockWeddingId, mockVendorId)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getVendorSummary', () => {
    it('aggregates total agreed cost, paid amount, and category breakdowns', async () => {
      vi.spyOn(VendorModel, 'aggregate').mockResolvedValue([
        { _id: 'PHOTOGRAPHER', count: 1, totalAgreedPaise: 25000000 },
        { _id: 'CATERER', count: 1, totalAgreedPaise: 45000000 },
      ]);
      vi.spyOn(VendorModel, 'countDocuments').mockResolvedValue(1);
      vi.spyOn(ExpenseModel, 'aggregate').mockResolvedValue([
        { _id: null, totalPaidPaise: 20000000 },
      ]);

      const summary = await VendorService.getVendorSummary(mockWeddingId);
      expect(summary.totalVendors).toBe(2);
      expect(summary.totalAgreedPaise).toBe(70000000);
      expect(summary.totalPaidPaise).toBe(20000000);
      expect(summary.pendingBalancePaise).toBe(50000000);
      expect(summary.categoriesCount).toBe(2);
      expect(summary.archivedCount).toBe(1);
    });
  });

  describe('searchNearbyVendors', () => {
    it('returns nearby wedding vendors and flags already added ones', async () => {
      vi.spyOn(WeddingModel, 'findById').mockReturnValue({
        select: vi.fn().mockResolvedValue({
          title: 'Vivek & Eisha',
          location: { city: 'Indore', formattedAddress: 'Indore, MP' },
        }),
      } as any);

      vi.spyOn(VendorModel, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId(mockVendorId),
            name: 'The Wedding Filmer Central',
            googlePlaceId: 'indore_photo_weddingfilmer',
          },
        ]),
      } as any);

      const { results, city } = await VendorService.searchNearbyVendors(mockWeddingId, {
        category: 'PHOTOGRAPHER',
        limit: 10,
      });

      expect(city).toBe('Indore');
      expect(results.length).toBeGreaterThan(0);
      const filmer = results.find((r) => r.googlePlaceId === 'indore_photo_weddingfilmer');
      expect(filmer?.isAdded).toBe(true);
      expect(filmer?.addedVendorId).toBe(mockVendorId);
    });
  });
});
