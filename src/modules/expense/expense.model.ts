import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  PAYMENT_STATUS,
  PaymentStatus,
  PAYER_SIDE,
  PayerSide,
  DEFAULT_CURRENCY,
} from '@/shared/constants';

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  weddingId: mongoose.Types.ObjectId;
  title: string;
  amountPaise: number;
  paidAmountPaise: number;
  paymentStatus: PaymentStatus;
  payerSide: PayerSide;
  currency: 'INR';
  expenseDate: Date;
  category: ExpenseCategory;
  eventId?: mongoose.Types.ObjectId | null;
  vendorId?: mongoose.Types.ObjectId | null;
  vendorName?: string | null;
  notes?: string | null;
  createdByMembershipId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    weddingId: {
      type: Schema.Types.ObjectId,
      ref: 'Wedding',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for amountPaise',
      },
    },
    paidAmountPaise: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for paidAmountPaise',
      },
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    payerSide: {
      type: String,
      enum: Object.values(PAYER_SIDE),
      default: PAYER_SIDE.SHARED,
      index: true,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      enum: [DEFAULT_CURRENCY],
    },
    expenseDate: {
      type: Date,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      default: 'OTHER',
      index: true,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingEvent',
      default: null,
      index: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
      index: true,
    },
    vendorName: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    createdByMembershipId: {
      type: Schema.Types.ObjectId,
      ref: 'WeddingMembership',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'expenses',
  }
);

// Indexes matching DATABASE_DESIGN.md Section 58 & query performance
expenseSchema.index({ weddingId: 1, expenseDate: -1 });
expenseSchema.index({ weddingId: 1, category: 1 });
expenseSchema.index({ weddingId: 1, paymentStatus: 1 });
expenseSchema.index({ weddingId: 1, payerSide: 1 });
expenseSchema.index({ weddingId: 1, eventId: 1 });

export const ExpenseModel: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) ||
  mongoose.model<IExpense>('Expense', expenseSchema);
