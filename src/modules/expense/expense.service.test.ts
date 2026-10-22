import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { ExpenseService } from './expense.service';
import { ExpenseModel } from './expense.model';
import { WeddingEventModel } from '@/modules/event/event.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import { PAYMENT_STATUS, PAYER_SIDE } from '@/shared/constants';

vi.mock('@/server/db/connection', () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

describe('ExpenseService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWeddingId = new mongoose.Types.ObjectId().toString();
  const mockMembershipId = new mongoose.Types.ObjectId().toString();
  const mockExpenseId = new mongoose.Types.ObjectId().toString();
  const mockEventId = new mongoose.Types.ObjectId().toString();

  describe('createExpense', () => {
    it('creates an expense successfully and returns DTO with calculated pending amount', async () => {
      const mockCreatedExpense = {
        _id: new mongoose.Types.ObjectId(mockExpenseId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Halwai Token Advance',
        amountPaise: 15000000, // ₹1,50,000
        paidAmountPaise: 5000000, // ₹50,000
        paymentStatus: PAYMENT_STATUS.PARTIAL,
        payerSide: PAYER_SIDE.SHARED,
        currency: 'INR',
        expenseDate: new Date('2026-10-18T10:00:00.000Z'),
        category: 'CATERING',
        eventId: null,
        vendorName: 'Sharma Caterers',
        notes: 'Initial token paid via NEFT',
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(ExpenseModel, 'create').mockResolvedValue(mockCreatedExpense as any);

      const result = await ExpenseService.createExpense(mockWeddingId, mockMembershipId, {
        title: 'Halwai Token Advance',
        amountPaise: 15000000,
        paidAmountPaise: 5000000,
        paymentStatus: PAYMENT_STATUS.PARTIAL,
        payerSide: PAYER_SIDE.SHARED,
        expenseDate: '2026-10-18T10:00:00.000Z',
        category: 'CATERING',
        eventId: null,
        vendorName: 'Sharma Caterers',
        notes: 'Initial token paid via NEFT',
      });

      expect(result.id).toBe(mockExpenseId);
      expect(result.title).toBe('Halwai Token Advance');
      expect(result.amountPaise).toBe(15000000);
      expect(result.paidAmountPaise).toBe(5000000);
      expect(result.pendingAmountPaise).toBe(10000000); // ₹1,00,000 pending
      expect(result.paymentStatus).toBe(PAYMENT_STATUS.PARTIAL);
      expect(result.payerSide).toBe(PAYER_SIDE.SHARED);
    });

    it('validates eventId belongs to the wedding when provided', async () => {
      vi.spyOn(WeddingEventModel, 'exists').mockResolvedValue(null as any);

      await expect(
        ExpenseService.createExpense(mockWeddingId, mockMembershipId, {
          title: 'Mandap Decor',
          amountPaise: 20000000,
          paidAmountPaise: 0,
          paymentStatus: PAYMENT_STATUS.PENDING,
          payerSide: PAYER_SIDE.GROOM,
          expenseDate: '2026-10-18T10:00:00.000Z',
          category: 'DECORATION',
          eventId: mockEventId,
          vendorName: null,
          notes: null,
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('listExpenses', () => {
    it('returns paginated list of expenses and pagination metadata', async () => {
      const mockExpenseDoc = {
        _id: new mongoose.Types.ObjectId(mockExpenseId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Bridal Lehenga',
        amountPaise: 8500000,
        paidAmountPaise: 8500000,
        paymentStatus: PAYMENT_STATUS.PAID,
        payerSide: PAYER_SIDE.BRIDE,
        currency: 'INR',
        expenseDate: new Date('2026-10-15T12:00:00.000Z'),
        category: 'CLOTHING',
        eventId: null,
        vendorName: 'Sabyasachi Store',
        notes: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockExpenseDoc]),
      };

      vi.spyOn(ExpenseModel, 'find').mockReturnValue(mockQuery as any);
      vi.spyOn(ExpenseModel, 'countDocuments').mockResolvedValue(1);

      const result = await ExpenseService.listExpenses(mockWeddingId, {
        page: 1,
        limit: 10,
      });

      expect(result.expenses).toHaveLength(1);
      expect(result.expenses[0].title).toBe('Bridal Lehenga');
      expect(result.expenses[0].pendingAmountPaise).toBe(0);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  describe('getExpenseById', () => {
    it('throws NotFoundError for non-existent expense', async () => {
      vi.spyOn(ExpenseModel, 'findOne').mockResolvedValue(null);

      await expect(
        ExpenseService.getExpenseById(mockWeddingId, mockExpenseId)
      ).rejects.toThrow(NotFoundError);
    });

    it('returns expense DTO when found', async () => {
      const mockDoc = {
        _id: new mongoose.Types.ObjectId(mockExpenseId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'DJ & Sound System',
        amountPaise: 6000000,
        paidAmountPaise: 3000000,
        paymentStatus: PAYMENT_STATUS.PARTIAL,
        payerSide: PAYER_SIDE.GROOM,
        currency: 'INR',
        expenseDate: new Date(),
        category: 'ENTERTAINMENT',
        eventId: null,
        vendorName: null,
        notes: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(ExpenseModel, 'findOne').mockResolvedValue(mockDoc as any);

      const result = await ExpenseService.getExpenseById(mockWeddingId, mockExpenseId);
      expect(result.title).toBe('DJ & Sound System');
      expect(result.pendingAmountPaise).toBe(3000000);
    });
  });

  describe('updateExpense', () => {
    it('updates expense fields and synchronizes paymentStatus if fully paid', async () => {
      const mockDoc = {
        _id: new mongoose.Types.ObjectId(mockExpenseId),
        weddingId: new mongoose.Types.ObjectId(mockWeddingId),
        title: 'Venue Advance',
        amountPaise: 50000000, // ₹5,00,000
        paidAmountPaise: 20000000,
        paymentStatus: PAYMENT_STATUS.PARTIAL,
        payerSide: PAYER_SIDE.SHARED,
        currency: 'INR',
        expenseDate: new Date(),
        category: 'VENUE',
        eventId: null,
        vendorName: 'Royal Palace',
        notes: null,
        createdByMembershipId: new mongoose.Types.ObjectId(mockMembershipId),
        createdAt: new Date(),
        updatedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(ExpenseModel, 'findOne').mockResolvedValue(mockDoc as any);

      // Updating paidAmountPaise to full amount
      const result = await ExpenseService.updateExpense(mockWeddingId, mockExpenseId, {
        paidAmountPaise: 50000000,
      });

      expect(result.paidAmountPaise).toBe(50000000);
      expect(result.pendingAmountPaise).toBe(0);
      expect(result.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    });
  });

  describe('deleteExpense', () => {
    it('deletes an existing expense', async () => {
      vi.spyOn(ExpenseModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      await expect(
        ExpenseService.deleteExpense(mockWeddingId, mockExpenseId)
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundError if expense to delete is not found', async () => {
      vi.spyOn(ExpenseModel, 'deleteOne').mockResolvedValue({ deletedCount: 0 } as any);

      await expect(
        ExpenseService.deleteExpense(mockWeddingId, mockExpenseId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getExpenseSummary', () => {
    it('computes financial aggregations across categories, payers, and payment statuses', async () => {
      vi.spyOn(ExpenseModel, 'aggregate')
        .mockResolvedValueOnce([
          { _id: null, totalAgreedPaise: 100000000, totalPaidPaise: 65000000, count: 5 },
        ])
        .mockResolvedValueOnce([
          { _id: 'VENUE', totalPaise: 60000000, paidPaise: 40000000, count: 1 },
          { _id: 'CATERING', totalPaise: 40000000, paidPaise: 25000000, count: 4 },
        ])
        .mockResolvedValueOnce([
          { _id: 'SHARED', totalPaise: 60000000, paidPaise: 40000000, count: 2 },
          { _id: 'GROOM', totalPaise: 40000000, paidPaise: 25000000, count: 3 },
        ])
        .mockResolvedValueOnce([
          { _id: 'PAID', count: 2 },
          { _id: 'PARTIAL', count: 3 },
        ]);

      const summary = await ExpenseService.getExpenseSummary(mockWeddingId);

      expect(summary.totalAgreedPaise).toBe(100000000); // ₹10,00,000
      expect(summary.totalPaidPaise).toBe(65000000); // ₹6,50,000
      expect(summary.totalPendingPaise).toBe(35000000); // ₹3,50,000
      expect(summary.totalCount).toBe(5);
      expect(summary.byCategory).toHaveLength(2);
      expect(summary.byCategory[0].category).toBe('VENUE');
      expect(summary.byPayer).toHaveLength(3);
      expect(summary.byStatus.paidCount).toBe(2);
      expect(summary.byStatus.partialCount).toBe(3);
      expect(summary.byStatus.pendingCount).toBe(0);
    });
  });
});
