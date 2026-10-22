import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getExpenses, POST as postExpense } from './route';
import { GET as getSummary } from './summary/route';
import {
  GET as getSingleExpense,
  PATCH as patchExpense,
  DELETE as deleteExpense,
} from './[expenseId]/route';
import { ExpenseService } from '@/modules/expense/expense.service';
import { USER_ROLES, PAYMENT_STATUS, PAYER_SIDE } from '@/shared/constants';
import * as sessionHelpers from '@/server/auth/session';

describe('Expense API Routes', () => {
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
    membershipId: 'm1',
    role: USER_ROLES.ADMIN,
  };

  const mockExpenseDTO = {
    id: 'exp1',
    weddingId: 'w1',
    title: 'Halwai Token Advance',
    amountPaise: 15000000,
    paidAmountPaise: 5000000,
    pendingAmountPaise: 10000000,
    paymentStatus: PAYMENT_STATUS.PARTIAL,
    payerSide: PAYER_SIDE.SHARED,
    currency: 'INR' as const,
    expenseDate: '2026-10-18T10:00:00.000Z',
    category: 'CATERING' as const,
    eventId: null,
    vendorName: 'Sharma Halwai',
    notes: 'Token given in cash',
    createdByMembershipId: 'm1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('GET /api/expenses', () => {
    it('returns 200 and list of expenses for authenticated wedding member', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'listExpenses').mockResolvedValue({
        expenses: [mockExpenseDTO],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      const request = new NextRequest('http://localhost:3000/api/expenses');
      const response = await getExpenses(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].title).toBe('Halwai Token Advance');
      expect(json.pagination.total).toBe(1);
    });
  });

  describe('POST /api/expenses', () => {
    it('returns 201 and creates new expense', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'createExpense').mockResolvedValue(mockExpenseDTO);

      const request = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Halwai Token Advance',
          amount: 150000,
          paidAmount: 50000,
          paymentStatus: 'PARTIAL',
          payerSide: 'SHARED',
          expenseDate: '2026-10-18T10:00:00.000Z',
          category: 'CATERING',
          vendorName: 'Sharma Halwai',
        }),
      });

      const response = await postExpense(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.data.title).toBe('Halwai Token Advance');
      expect(json.data.amountPaise).toBe(15000000);
    });
  });

  describe('GET /api/expenses/summary', () => {
    it('returns 200 with aggregated wedding financial statistics', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'getExpenseSummary').mockResolvedValue({
        totalAgreedPaise: 25000000,
        totalPaidPaise: 15000000,
        totalPendingPaise: 10000000,
        totalCount: 3,
        byCategory: [
          { category: 'CATERING', totalPaise: 15000000, paidPaise: 10000000, pendingPaise: 5000000, count: 2 },
          { category: 'VENUE', totalPaise: 10000000, paidPaise: 5000000, pendingPaise: 5000000, count: 1 },
        ],
        byPayer: [
          { payerSide: 'GROOM', totalPaise: 10000000, paidPaise: 5000000, pendingPaise: 5000000, count: 1 },
          { payerSide: 'BRIDE', totalPaise: 5000000, paidPaise: 5000000, pendingPaise: 0, count: 1 },
          { payerSide: 'SHARED', totalPaise: 10000000, paidPaise: 5000000, pendingPaise: 5000000, count: 1 },
        ],
        byStatus: { pendingCount: 0, partialCount: 2, paidCount: 1 },
      });

      const request = new NextRequest('http://localhost:3000/api/expenses/summary');
      const response = await getSummary(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.totalAgreedPaise).toBe(25000000);
      expect(json.data.totalPendingPaise).toBe(10000000);
      expect(json.data.byCategory).toHaveLength(2);
    });
  });

  describe('GET /api/expenses/[expenseId]', () => {
    it('returns 200 and single expense', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'getExpenseById').mockResolvedValue(mockExpenseDTO);

      const request = new NextRequest('http://localhost:3000/api/expenses/exp1');
      const response = await getSingleExpense(request, { params: { expenseId: 'exp1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.id).toBe('exp1');
    });
  });

  describe('PATCH /api/expenses/[expenseId]', () => {
    it('returns 200 and updated expense', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'updateExpense').mockResolvedValue({
        ...mockExpenseDTO,
        paidAmountPaise: 15000000,
        pendingAmountPaise: 0,
        paymentStatus: PAYMENT_STATUS.PAID,
      });

      const request = new NextRequest('http://localhost:3000/api/expenses/exp1', {
        method: 'PATCH',
        body: JSON.stringify({
          paidAmount: 150000,
          paymentStatus: 'PAID',
        }),
      });

      const response = await patchExpense(request, { params: { expenseId: 'exp1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.paidAmountPaise).toBe(15000000);
      expect(json.data.paymentStatus).toBe(PAYMENT_STATUS.PAID);
    });
  });

  describe('DELETE /api/expenses/[expenseId]', () => {
    it('returns 200 and success: true', async () => {
      vi.spyOn(sessionHelpers, 'requireWeddingMember').mockResolvedValue(mockMemberContext);
      vi.spyOn(ExpenseService, 'deleteExpense').mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/expenses/exp1', {
        method: 'DELETE',
      });

      const response = await deleteExpense(request, { params: { expenseId: 'exp1' } });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});
