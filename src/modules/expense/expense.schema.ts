import { z } from 'zod';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_STATUS,
  PAYER_SIDE,
  PAGINATION,
} from '@/shared/constants';
import { rupeesToPaise } from '@/shared/utils/currency';

export const expenseCategorySchema = z.enum(EXPENSE_CATEGORIES);
export const paymentStatusSchema = z.enum([
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PARTIAL,
  PAYMENT_STATUS.PAID,
]);
export const payerSideSchema = z.enum([
  PAYER_SIDE.GROOM,
  PAYER_SIDE.BRIDE,
  PAYER_SIDE.SHARED,
]);

export const createExpenseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Expense title is required')
      .max(100, 'Title must not exceed 100 characters'),
    // Accept either amount in rupees (number) or amountPaise (integer)
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than zero')
      .max(1000000000, 'Amount cannot exceed ₹100 Crore')
      .optional(),
    amountPaise: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    paidAmount: z
      .number()
      .nonnegative('Paid amount cannot be negative')
      .optional(),
    paidAmountPaise: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    paymentStatus: paymentStatusSchema.optional(),
    payerSide: payerSideSchema.optional().default('SHARED'),
    expenseDate: z
      .string()
      .datetime({ offset: true, message: 'expenseDate must be a valid ISO 8601 datetime' }),
    category: expenseCategorySchema.optional().default('OTHER'),
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid eventId format')
      .optional()
      .nullable(),
    vendorName: z
      .string()
      .trim()
      .max(100, 'Vendor name must not exceed 100 characters')
      .optional()
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must not exceed 1000 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.amount !== undefined || data.amountPaise !== undefined,
    {
      message: 'Either amount (in Rupees) or amountPaise must be provided',
      path: ['amount'],
    }
  )
  .transform((data) => {
    // Resolve amountPaise
    const resolvedAmountPaise =
      data.amountPaise !== undefined
        ? data.amountPaise
        : rupeesToPaise(data.amount!);

    // Resolve paidAmountPaise
    let resolvedPaidAmountPaise =
      data.paidAmountPaise !== undefined
        ? data.paidAmountPaise
        : data.paidAmount !== undefined
        ? rupeesToPaise(data.paidAmount)
        : 0;

    // Resolve paymentStatus
    let resolvedStatus = data.paymentStatus;
    if (!resolvedStatus) {
      if (resolvedPaidAmountPaise >= resolvedAmountPaise && resolvedAmountPaise > 0) {
        resolvedStatus = PAYMENT_STATUS.PAID;
      } else if (resolvedPaidAmountPaise > 0) {
        resolvedStatus = PAYMENT_STATUS.PARTIAL;
      } else {
        resolvedStatus = PAYMENT_STATUS.PENDING;
      }
    } else if (resolvedStatus === PAYMENT_STATUS.PAID && resolvedPaidAmountPaise === 0) {
      // If user marks PAID but left paidAmount blank, set it to full amount
      resolvedPaidAmountPaise = resolvedAmountPaise;
    }

    // Clamp paidAmount to total amount
    if (resolvedPaidAmountPaise > resolvedAmountPaise) {
      resolvedPaidAmountPaise = resolvedAmountPaise;
    }

    return {
      title: data.title,
      amountPaise: resolvedAmountPaise,
      paidAmountPaise: resolvedPaidAmountPaise,
      paymentStatus: resolvedStatus,
      payerSide: data.payerSide,
      expenseDate: data.expenseDate,
      category: data.category,
      eventId: data.eventId || null,
      vendorName: data.vendorName || null,
      notes: data.notes || null,
    };
  });

export type CreateExpenseInput = z.input<typeof createExpenseSchema>;
export type CreateExpenseOutput = z.output<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    amount: z.number().positive().max(1000000000).optional(),
    amountPaise: z.number().int().nonnegative().optional(),
    paidAmount: z.number().nonnegative().optional(),
    paidAmountPaise: z.number().int().nonnegative().optional(),
    paymentStatus: paymentStatusSchema.optional(),
    payerSide: payerSideSchema.optional(),
    expenseDate: z.string().datetime({ offset: true }).optional(),
    category: expenseCategorySchema.optional(),
    eventId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid eventId format')
      .optional()
      .nullable(),
    vendorName: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .transform((data) => {
    const transformed: Record<string, unknown> = {};

    if (data.title !== undefined) transformed.title = data.title;
    if (data.amountPaise !== undefined) {
      transformed.amountPaise = data.amountPaise;
    } else if (data.amount !== undefined) {
      transformed.amountPaise = rupeesToPaise(data.amount);
    }

    if (data.paidAmountPaise !== undefined) {
      transformed.paidAmountPaise = data.paidAmountPaise;
    } else if (data.paidAmount !== undefined) {
      transformed.paidAmountPaise = rupeesToPaise(data.paidAmount);
    }

    if (data.paymentStatus !== undefined) transformed.paymentStatus = data.paymentStatus;
    if (data.payerSide !== undefined) transformed.payerSide = data.payerSide;
    if (data.expenseDate !== undefined) transformed.expenseDate = data.expenseDate;
    if (data.category !== undefined) transformed.category = data.category;
    if (data.eventId !== undefined) transformed.eventId = data.eventId;
    if (data.vendorName !== undefined) transformed.vendorName = data.vendorName;
    if (data.notes !== undefined) transformed.notes = data.notes;

    return transformed;
  });

export type UpdateExpenseInput = z.input<typeof updateExpenseSchema>;

export const queryExpensesSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10) || 1) : PAGINATION.DEFAULT_PAGE)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = parseInt(val || '', 10);
      if (isNaN(parsed) || parsed < 1) return PAGINATION.DEFAULT_LIMIT;
      return Math.min(parsed, PAGINATION.MAX_LIMIT);
    }),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  paymentStatus: z.string().trim().optional(),
  payerSide: z.string().trim().optional(),
  eventId: z.string().trim().optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export type QueryExpensesInput = z.infer<typeof queryExpensesSchema>;
