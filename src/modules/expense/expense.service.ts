import mongoose from 'mongoose';
import { ExpenseModel, IExpense } from './expense.model';
import { CreateExpenseOutput, QueryExpensesInput } from './expense.schema';
import { WeddingEventModel } from '@/modules/event/event.model';
import { NotFoundError, ValidationError } from '@/shared/errors/app-error';
import {
  ExpenseCategory,
  PaymentStatus,
  PayerSide,
  PAYMENT_STATUS,
  PAYER_SIDE,
  PAGINATION,
} from '@/shared/constants';
import { connectToDatabase } from '@/server/db/connection';

export interface ExpenseDTO {
  id: string;
  weddingId: string;
  title: string;
  amountPaise: number;
  paidAmountPaise: number;
  pendingAmountPaise: number;
  paymentStatus: PaymentStatus;
  payerSide: PayerSide;
  currency: 'INR';
  expenseDate: string;
  category: ExpenseCategory;
  eventId?: string | null;
  vendorName?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategoryBreakdown {
  category: ExpenseCategory;
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  count: number;
}

export interface ExpensePayerBreakdown {
  payerSide: PayerSide;
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  count: number;
}

export interface ExpenseSummaryDTO {
  totalAgreedPaise: number;
  totalPaidPaise: number;
  totalPendingPaise: number;
  totalCount: number;
  byCategory: ExpenseCategoryBreakdown[];
  byPayer: ExpensePayerBreakdown[];
  byStatus: {
    pendingCount: number;
    partialCount: number;
    paidCount: number;
  };
}

export function toExpenseDTO(expense: IExpense): ExpenseDTO {
  const pending = Math.max(0, expense.amountPaise - expense.paidAmountPaise);
  return {
    id: expense._id.toString(),
    weddingId: expense.weddingId.toString(),
    title: expense.title,
    amountPaise: expense.amountPaise,
    paidAmountPaise: expense.paidAmountPaise,
    pendingAmountPaise: pending,
    paymentStatus: expense.paymentStatus,
    payerSide: expense.payerSide,
    currency: expense.currency,
    expenseDate: expense.expenseDate.toISOString(),
    category: expense.category,
    eventId: expense.eventId ? expense.eventId.toString() : null,
    vendorName: expense.vendorName ?? null,
    notes: expense.notes ?? null,
    createdByMembershipId: expense.createdByMembershipId.toString(),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

export class ExpenseService {
  static async listExpenses(
    weddingId: string,
    query?: QueryExpensesInput
  ): Promise<{
    expenses: ExpenseDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const filter: Record<string, unknown> = { weddingId: weddingObjectId };

    if (query?.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { vendorName: searchRegex },
        { notes: searchRegex },
      ];
    }

    if (query?.category) {
      filter.category = query.category;
    }

    if (query?.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query?.payerSide) {
      filter.payerSide = query.payerSide;
    }

    if (query?.eventId && mongoose.Types.ObjectId.isValid(query.eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(query.eventId);
    }

    if (query?.from || query?.to) {
      const dateFilter: Record<string, Date> = {};
      if (query.from) dateFilter.$gte = new Date(query.from);
      if (query.to) dateFilter.$lte = new Date(query.to);
      filter.expenseDate = dateFilter;
    }

    const page = query?.page || PAGINATION.DEFAULT_PAGE;
    const limit = query?.limit || PAGINATION.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(filter)
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ExpenseModel.countDocuments(filter),
    ]);

    return {
      expenses: expenses.map(toExpenseDTO),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  static async createExpense(
    weddingId: string,
    membershipId: string,
    input: CreateExpenseOutput
  ): Promise<ExpenseDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const membershipObjectId = new mongoose.Types.ObjectId(membershipId);

    let eventObjectId: mongoose.Types.ObjectId | null = null;
    if (input.eventId) {
      if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
        throw new ValidationError('Invalid eventId');
      }
      eventObjectId = new mongoose.Types.ObjectId(input.eventId);
      // Verify event belongs to this wedding (integrity check)
      const eventExists = await WeddingEventModel.exists({
        _id: eventObjectId,
        weddingId: weddingObjectId,
      });
      if (!eventExists) {
        throw new ValidationError('Associated event does not belong to this wedding');
      }
    }

    const expense = await ExpenseModel.create({
      weddingId: weddingObjectId,
      title: input.title.trim(),
      amountPaise: input.amountPaise,
      paidAmountPaise: input.paidAmountPaise,
      paymentStatus: input.paymentStatus,
      payerSide: input.payerSide,
      currency: 'INR',
      expenseDate: new Date(input.expenseDate),
      category: input.category,
      eventId: eventObjectId,
      vendorName: input.vendorName?.trim() || null,
      notes: input.notes?.trim() || null,
      createdByMembershipId: membershipObjectId,
    });

    return toExpenseDTO(expense);
  }

  static async getExpenseById(weddingId: string, expenseId: string): Promise<ExpenseDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new NotFoundError('Expense not found');
    }

    const expense = await ExpenseModel.findOne({
      _id: new mongoose.Types.ObjectId(expenseId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return toExpenseDTO(expense);
  }

  static async updateExpense(
    weddingId: string,
    expenseId: string,
    input: Record<string, unknown>
  ): Promise<ExpenseDTO> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new NotFoundError('Expense not found');
    }

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);
    const expenseObjectId = new mongoose.Types.ObjectId(expenseId);

    const expense = await ExpenseModel.findOne({
      _id: expenseObjectId,
      weddingId: weddingObjectId,
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify eventId integrity if updating eventId
    if (input.eventId !== undefined) {
      if (input.eventId === null) {
        expense.eventId = null;
      } else if (typeof input.eventId === 'string') {
        if (!mongoose.Types.ObjectId.isValid(input.eventId)) {
          throw new ValidationError('Invalid eventId');
        }
        const eventObjectId = new mongoose.Types.ObjectId(input.eventId);
        const eventExists = await WeddingEventModel.exists({
          _id: eventObjectId,
          weddingId: weddingObjectId,
        });
        if (!eventExists) {
          throw new ValidationError('Associated event does not belong to this wedding');
        }
        expense.eventId = eventObjectId;
      }
    }

    if (input.title !== undefined) expense.title = (input.title as string).trim();
    if (input.amountPaise !== undefined) expense.amountPaise = input.amountPaise as number;
    if (input.paidAmountPaise !== undefined) expense.paidAmountPaise = input.paidAmountPaise as number;
    if (input.paymentStatus !== undefined) expense.paymentStatus = input.paymentStatus as PaymentStatus;
    if (input.payerSide !== undefined) expense.payerSide = input.payerSide as PayerSide;
    if (input.expenseDate !== undefined) expense.expenseDate = new Date(input.expenseDate as string);
    if (input.category !== undefined) expense.category = input.category as ExpenseCategory;
    if (input.vendorName !== undefined) {
      expense.vendorName = input.vendorName ? (input.vendorName as string).trim() : null;
    }
    if (input.notes !== undefined) {
      expense.notes = input.notes ? (input.notes as string).trim() : null;
    }

    // Automatic status synchronization if paidAmount exceeds or equals total
    if (expense.paidAmountPaise >= expense.amountPaise && expense.amountPaise > 0) {
      if (!input.paymentStatus) {
        expense.paymentStatus = PAYMENT_STATUS.PAID;
      }
    }

    await expense.save();
    return toExpenseDTO(expense);
  }

  static async deleteExpense(weddingId: string, expenseId: string): Promise<void> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      throw new NotFoundError('Expense not found');
    }

    const result = await ExpenseModel.deleteOne({
      _id: new mongoose.Types.ObjectId(expenseId),
      weddingId: new mongoose.Types.ObjectId(weddingId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Expense not found');
    }
  }

  static async getExpenseSummary(weddingId: string): Promise<ExpenseSummaryDTO> {
    await connectToDatabase();

    const weddingObjectId = new mongoose.Types.ObjectId(weddingId);

    const [totalAggregate, categoryAggregate, payerAggregate, statusCounts] = await Promise.all([
      // Overall totals
      ExpenseModel.aggregate([
        { $match: { weddingId: weddingObjectId } },
        {
          $group: {
            _id: null,
            totalAgreedPaise: { $sum: '$amountPaise' },
            totalPaidPaise: { $sum: '$paidAmountPaise' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Grouped by Category
      ExpenseModel.aggregate([
        { $match: { weddingId: weddingObjectId } },
        {
          $group: {
            _id: '$category',
            totalPaise: { $sum: '$amountPaise' },
            paidPaise: { $sum: '$paidAmountPaise' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalPaise: -1 } },
      ]),

      // Grouped by Payer Side
      ExpenseModel.aggregate([
        { $match: { weddingId: weddingObjectId } },
        {
          $group: {
            _id: '$payerSide',
            totalPaise: { $sum: '$amountPaise' },
            paidPaise: { $sum: '$paidAmountPaise' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalPaise: -1 } },
      ]),

      // Counts by Payment Status
      ExpenseModel.aggregate([
        { $match: { weddingId: weddingObjectId } },
        {
          $group: {
            _id: '$paymentStatus',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalAgreedPaise = totalAggregate[0]?.totalAgreedPaise || 0;
    const totalPaidPaise = totalAggregate[0]?.totalPaidPaise || 0;
    const totalCount = totalAggregate[0]?.count || 0;
    const totalPendingPaise = Math.max(0, totalAgreedPaise - totalPaidPaise);

    const byCategory: ExpenseCategoryBreakdown[] = categoryAggregate.map((cat) => ({
      category: cat._id as ExpenseCategory,
      totalPaise: cat.totalPaise,
      paidPaise: cat.paidPaise,
      pendingPaise: Math.max(0, cat.totalPaise - cat.paidPaise),
      count: cat.count,
    }));

    // Ensure all 3 payer sides are represented
    const payerMap = new Map<string, { totalPaise: number; paidPaise: number; count: number }>();
    payerAggregate.forEach((p) => {
      payerMap.set(p._id, {
        totalPaise: p.totalPaise,
        paidPaise: p.paidPaise,
        count: p.count,
      });
    });

    const byPayer: ExpensePayerBreakdown[] = [
      PAYER_SIDE.GROOM,
      PAYER_SIDE.BRIDE,
      PAYER_SIDE.SHARED,
    ].map((side) => {
      const data = payerMap.get(side) || { totalPaise: 0, paidPaise: 0, count: 0 };
      return {
        payerSide: side,
        totalPaise: data.totalPaise,
        paidPaise: data.paidPaise,
        pendingPaise: Math.max(0, data.totalPaise - data.paidPaise),
        count: data.count,
      };
    });

    const statusMap = new Map<string, number>();
    statusCounts.forEach((s) => statusMap.set(s._id, s.count));

    return {
      totalAgreedPaise,
      totalPaidPaise,
      totalPendingPaise,
      totalCount,
      byCategory,
      byPayer,
      byStatus: {
        pendingCount: statusMap.get(PAYMENT_STATUS.PENDING) || 0,
        partialCount: statusMap.get(PAYMENT_STATUS.PARTIAL) || 0,
        paidCount: statusMap.get(PAYMENT_STATUS.PAID) || 0,
      },
    };
  }
}
